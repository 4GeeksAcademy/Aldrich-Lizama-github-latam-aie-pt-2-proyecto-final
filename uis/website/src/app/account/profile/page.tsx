"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import { API_BASE_URL } from "@/lib/api";
import { authHeaders, clearAuthToken, getAuthToken } from "@/lib/auth";

// ──────────────────────────────────────────────────────────────
//  Tipos
// ──────────────────────────────────────────────────────────────

type UserProfile = {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  profile: {
    id: number;
    user_id: number;
    name: string;
    phone: string;
    address: string;
  } | null;
};

type Application = {
  id: number;
  job_title: string;
  company_name: string;
  location: string | null;
  status: "pending" | "reviewing" | "accepted" | "rejected";
  notes: string | null;
  applied_at: string;
};

type ApplicationCard = {
  id?: number;
  full_name: string;
  phone: string;
  address: string;
  education: string;
  experience: string;
  skills: string;
  linkedin: string;
  portfolio: string;
  availability: string;
};

type TabId = "profile" | "applications" | "card";

// ──────────────────────────────────────────────────────────────
//  Componente principal
// ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
  // -- Auth --
  const hasToken = useSyncExternalStore(subscribe, getToken, () => null);

  // -- Tab --
  const [tab, setTab] = useState<TabId>("profile");

  // -- Perfil --
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // -- Postulaciones --
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);

  // Formulario nueva postulación
  const [showNewApp, setShowNewApp] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newStatus, setNewStatus] = useState("pending");
  const [newNotes, setNewNotes] = useState("");
  const [savingApp, setSavingApp] = useState(false);

  // -- Ficha --
  const [appCard, setAppCard] = useState<ApplicationCard>({
    full_name: "",
    phone: "",
    address: "",
    education: "",
    experience: "",
    skills: "",
    linkedin: "",
    portfolio: "",
    availability: "",
  });
  const [loadingCard, setLoadingCard] = useState(false);
  const [cardSaving, setCardSaving] = useState(false);
  const [cardSaveSuccess, setCardSaveSuccess] = useState(false);
  const [cardSaveError, setCardSaveError] = useState<string | null>(null);

  const headers = () => authHeaders();

  // ════════════════════════════════════════════════════════════
  //  Efecto: cargar perfil al montar
  // ════════════════════════════════════════════════════════════

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!hasToken) {
        if (!cancelled) setLoadingProfile(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: headers() });
        if (cancelled) return;
        if (res.status === 401) {
          clearAuthToken();
          if (!cancelled) setProfileError("Tu sesión ha expirado. Inicia sesión de nuevo.");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setProfileError("Error al cargar tu perfil.");
          return;
        }
        const data = (await res.json()) as UserProfile;
        if (cancelled) return;
        setProfile(data);
        setName(data.profile?.name ?? "");
        setPhone(data.profile?.phone ?? "");
        setAddress(data.profile?.address ?? "");
      } catch {
        if (!cancelled) setProfileError("No se pudo conectar con el servidor.");
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, [hasToken]);

  // ════════════════════════════════════════════════════════════
  //  Efecto: cargar postulaciones al cambiar a apps tab
  // ════════════════════════════════════════════════════════════

  useEffect(() => {
    if (tab !== "applications" || !hasToken) return;
    let cancelled = false;
    const fetchApps = async () => {
      setLoadingApps(true);
      setAppsError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/applications/`, {
          headers: headers(),
        });
        if (cancelled) return;
        if (res.status === 401) {
          clearAuthToken();
          if (!cancelled) setAppsError("Tu sesión ha expirado.");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setAppsError("Error al cargar postulaciones.");
          return;
        }
        const data = (await res.json()) as Application[];
        if (!cancelled) setApplications(data);
      } catch {
        if (!cancelled) setAppsError("No se pudo conectar con el servidor.");
      } finally {
        if (!cancelled) setLoadingApps(false);
      }
    };
    fetchApps();
    return () => { cancelled = true; };
  }, [tab, hasToken]);

  // ════════════════════════════════════════════════════════════
  //  Efecto: cargar ficha al cambiar a card tab
  // ════════════════════════════════════════════════════════════

  useEffect(() => {
    if (tab !== "card" || !hasToken) return;
    let cancelled = false;
    const fetchCard = async () => {
      setLoadingCard(true);
      try {
        const res = await fetch(`${API_BASE_URL}/applications/card`, {
          headers: headers(),
        });
        if (cancelled) return;
        if (res.ok) {
          const data = (await res.json()) as ApplicationCard;
          if (!cancelled && data.id) setAppCard(data);
        }
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoadingCard(false);
      }
    };
    fetchCard();
    return () => { cancelled = true; };
  }, [tab, hasToken]);

  // ════════════════════════════════════════════════════════════
  //  Guardar perfil
  // ════════════════════════════════════════════════════════════

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (saving || saveSuccess) return;
    setSaveError(null);
    setSaveSuccess(false);
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/profiles/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({ name: name.trim() || null, phone: phone.trim() || null, address: address.trim() || null }),
      });
      if (res.status === 401) { clearAuthToken(); setSaveError("Tu sesión ha expirado."); return; }
      if (!res.ok) { const d = await res.json(); setSaveError(d.detail ?? "Error al guardar."); return; }
      setSaveSuccess(true);
      if (name.trim()) setProfile((prev) => prev ? { ...prev, profile: { ...prev.profile!, name: name.trim() } } : prev);
    } catch {
      setSaveError("No se pudo conectar con el servidor.");
    } finally { setSaving(false); }
  };

  // ════════════════════════════════════════════════════════════
  //  Crear postulación
  // ════════════════════════════════════════════════════════════

  const createApplication = async (e: FormEvent) => {
    e.preventDefault();
    if (savingApp) return;
    setSavingApp(true);
    try {
      const res = await fetch(`${API_BASE_URL}/applications/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({
          job_title: newJobTitle,
          company_name: newCompany,
          location: newLocation || null,
          status: newStatus,
          notes: newNotes || null,
        }),
      });
      if (res.status === 401) { clearAuthToken(); return; }
      if (res.ok) {
        const app = (await res.json()) as Application;
        setApplications((prev) => [app, ...prev]);
        setShowNewApp(false);
        setNewJobTitle("");
        setNewCompany("");
        setNewLocation("");
        setNewStatus("pending");
        setNewNotes("");
      }
    } catch { /* ignore */ }
    finally { setSavingApp(false); }
  };

  // ════════════════════════════════════════════════════════════
  //  Guardar ficha
  // ════════════════════════════════════════════════════════════

  const saveCard = async (e: FormEvent) => {
    e.preventDefault();
    if (cardSaving) return;
    setCardSaveError(null);
    setCardSaveSuccess(false);
    setCardSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/applications/card`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({
          full_name: appCard.full_name,
          phone: appCard.phone,
          address: appCard.address,
          education: appCard.education,
          experience: appCard.experience,
          skills: appCard.skills,
          linkedin: appCard.linkedin,
          portfolio: appCard.portfolio,
          availability: appCard.availability,
        }),
      });
      if (res.status === 401) { clearAuthToken(); setCardSaveError("Tu sesión ha expirado."); return; }
      if (!res.ok) { setCardSaveError("Error al guardar la ficha."); return; }
      setCardSaveSuccess(true);
    } catch {
      setCardSaveError("No se pudo conectar con el servidor.");
    } finally { setCardSaving(false); }
  };

  // ════════════════════════════════════════════════════════════
  //  Render: Sin sesión
  // ════════════════════════════════════════════════════════════

  if (!hasToken && !loadingProfile) {
    return (
      <main className="container section" style={{ maxWidth: 560 }}>
        <h1 style={{ marginTop: 0 }}>Mi espacio</h1>
        <div className="card" style={{ padding: "1rem", textAlign: "center" }}>
          <p>Debes iniciar sesión para acceder a tu espacio personal.</p>
          <Link className="btn btn-primary" href="/login">Iniciar sesión</Link>
        </div>
      </main>
    );
  }

  if (loadingProfile) {
    return (
      <main className="container section" style={{ maxWidth: 720 }}>
        <h1 style={{ marginTop: 0 }}>Mi espacio</h1>
        <p style={{ color: "var(--muted)" }}>Cargando tus datos…</p>
      </main>
    );
  }

  if (profileError) {
    return (
      <main className="container section" style={{ maxWidth: 720 }}>
        <h1 style={{ marginTop: 0 }}>Mi espacio</h1>
        <p style={{ color: "crimson" }}>{profileError}</p>
        <Link className="btn btn-primary" href="/login">Iniciar sesión</Link>
      </main>
    );
  }

  // ════════════════════════════════════════════════════════════
  //  Render: Navegación de tabs
  // ════════════════════════════════════════════════════════════

  const tabStyle = (id: TabId): React.CSSProperties => ({
    padding: "0.6rem 1.2rem",
    fontWeight: 600,
    cursor: "pointer",
    borderRadius: "0.5rem 0.5rem 0 0",
    border: tab === id ? "1px solid var(--border)" : "1px solid transparent",
    borderBottom: tab === id ? "2px solid var(--brand)" : "2px solid transparent",
    background: tab === id ? "var(--bg)" : "transparent",
    color: tab === id ? "var(--brand)" : "var(--muted)",
    transition: "all 0.15s ease",
  });

  return (
    <main className="container section" style={{ maxWidth: 780 }}>
      <h1 style={{ marginTop: 0 }}>Mi espacio</h1>
      <p style={{ color: "var(--muted)", marginBottom: "0.5rem" }}>
        {profile?.email}
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: "1rem" }}>
        <button style={tabStyle("profile")} onClick={() => setTab("profile")}>
          Perfil
        </button>
        <button style={tabStyle("applications")} onClick={() => setTab("applications")}>
          Mis postulaciones
        </button>
        <button style={tabStyle("card")} onClick={() => setTab("card")}>
          Mi ficha
        </button>
      </div>

      {/* ──── TAB: Perfil ──── */}
      {tab === "profile" && (
        <form onSubmit={saveProfile} className="card" style={{ padding: "1rem", display: "grid", gap: "0.9rem" }}>
          <div>
            <label htmlFor="name">Nombre completo</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" style={{ width: "100%" }} />
          </div>
          <div>
            <label htmlFor="phone">Teléfono</label>
            <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 600 000 000" style={{ width: "100%" }} />
          </div>
          <div>
            <label htmlFor="address">Dirección</label>
            <input id="address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Tu dirección (opcional)" style={{ width: "100%" }} />
          </div>
          {saveError && <p style={{ color: "crimson", margin: 0 }}>{saveError}</p>}
          {saveSuccess && <p style={{ color: "#2d8a52", margin: 0 }}>Perfil actualizado correctamente.</p>}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
          <hr style={{ borderColor: "var(--border)", margin: "0.5rem 0" }} />
          <p style={{ margin: 0, textAlign: "center" }}>
            <Link href="/account/change-password" style={{ color: "var(--brand-hover)", fontWeight: 600 }}>
              Cambiar contraseña
            </Link>
          </p>
        </form>
      )}

      {/* ──── TAB: Mis postulaciones ──── */}
      {tab === "applications" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.6rem" }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowNewApp(!showNewApp)}
              style={{ padding: "0.4rem 0.9rem", fontSize: "0.9rem" }}
            >
              {showNewApp ? "Cancelar" : "+ Nueva postulación"}
            </button>
          </div>

          {showNewApp && (
            <form onSubmit={createApplication} className="card" style={{ padding: "0.8rem", display: "grid", gap: "0.7rem", marginBottom: "1rem" }}>
              <input placeholder="Puesto *" required value={newJobTitle} onChange={(e) => setNewJobTitle(e.target.value)} style={{ width: "100%" }} />
              <input placeholder="Empresa *" required value={newCompany} onChange={(e) => setNewCompany(e.target.value)} style={{ width: "100%" }} />
              <input placeholder="Ubicación" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} style={{ width: "100%" }} />
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ width: "100%" }}>
                <option value="pending">Pendiente</option>
                <option value="reviewing">En revisión</option>
                <option value="accepted">Aceptada</option>
                <option value="rejected">Rechazada</option>
              </select>
              <textarea placeholder="Notas (opcional)" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} rows={2} style={{ width: "100%", resize: "vertical" }} />
              <button type="submit" className="btn btn-primary" disabled={savingApp} style={{ padding: "0.4rem 0.9rem", fontSize: "0.9rem" }}>
                {savingApp ? "Guardando…" : "Registrar postulación"}
              </button>
            </form>
          )}

          {loadingApps && <p style={{ color: "var(--muted)" }}>Cargando postulaciones…</p>}
          {appsError && <p style={{ color: "crimson" }}>{appsError}</p>}
          {!loadingApps && !appsError && applications.length === 0 && (
            <p style={{ color: "var(--muted)", textAlign: "center", padding: "1rem" }}>
              Aún no tienes postulaciones registradas.
            </p>
          )}
          <div style={{ display: "grid", gap: "0.6rem" }}>
            {applications.map((app) => {
              const statusColors: Record<string, string> = {
                pending: "var(--muted)",
                reviewing: "#d4a72c",
                accepted: "#2d8a52",
                rejected: "crimson",
              };
              return (
                <div key={app.id} className="card" style={{ padding: "0.7rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>{app.job_title}</strong>
                    <br />
                    <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
                      {app.company_name}{app.location ? ` · ${app.location}` : ""}
                    </span>
                  </div>
                  <span style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: statusColors[app.status] ?? "var(--muted)",
                    textTransform: "uppercase",
                  }}>
                    {app.status === "pending" ? "Pendiente"
                      : app.status === "reviewing" ? "En revisión"
                      : app.status === "accepted" ? "Aceptada"
                      : "Rechazada"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ──── TAB: Mi ficha ──── */}
      {tab === "card" && (
        <div>
          <p style={{ color: "var(--muted)", marginTop: 0, marginBottom: "0.8rem" }}>
            Completa esta ficha para agilizar tus futuras postulaciones. Los datos se autocompletarán en el formulario de talento.
          </p>
          {loadingCard ? (
            <p style={{ color: "var(--muted)" }}>Cargando ficha…</p>
          ) : (
            <form onSubmit={saveCard} className="card" style={{ padding: "1rem", display: "grid", gap: "0.8rem" }}>
              <div>
                <label>Nombre completo</label>
                <input value={appCard.full_name} onChange={(e) => setAppCard({ ...appCard, full_name: e.target.value })} placeholder="Tu nombre completo" style={{ width: "100%" }} />
              </div>
              <div>
                <label>Teléfono de contacto</label>
                <input value={appCard.phone} onChange={(e) => setAppCard({ ...appCard, phone: e.target.value })} placeholder="+34 600 000 000" style={{ width: "100%" }} />
              </div>
              <div>
                <label>Dirección</label>
                <input value={appCard.address} onChange={(e) => setAppCard({ ...appCard, address: e.target.value })} placeholder="Tu dirección" style={{ width: "100%" }} />
              </div>
              <div>
                <label>Formación académica</label>
                <textarea value={appCard.education} onChange={(e) => setAppCard({ ...appCard, education: e.target.value })} placeholder="Títulos, certificaciones, cursos relevantes…" rows={3} style={{ width: "100%", resize: "vertical" }} />
              </div>
              <div>
                <label>Experiencia laboral</label>
                <textarea value={appCard.experience} onChange={(e) => setAppCard({ ...appCard, experience: e.target.value })} placeholder="Empresas, cargos, años de experiencia…" rows={3} style={{ width: "100%", resize: "vertical" }} />
              </div>
              <div>
                <label>Habilidades / competencias</label>
                <textarea value={appCard.skills} onChange={(e) => setAppCard({ ...appCard, skills: e.target.value })} placeholder="Python, liderazgo, análisis de datos…" rows={2} style={{ width: "100%", resize: "vertical" }} />
              </div>
              <div>
                <label>LinkedIn</label>
                <input value={appCard.linkedin} onChange={(e) => setAppCard({ ...appCard, linkedin: e.target.value })} placeholder="https://linkedin.com/in/tu-perfil" style={{ width: "100%" }} />
              </div>
              <div>
                <label>Portfolio / web personal</label>
                <input value={appCard.portfolio} onChange={(e) => setAppCard({ ...appCard, portfolio: e.target.value })} placeholder="https://tusitio.com (opcional)" style={{ width: "100%" }} />
              </div>
              <div>
                <label>Disponibilidad</label>
                <input value={appCard.availability} onChange={(e) => setAppCard({ ...appCard, availability: e.target.value })} placeholder="Inmediata / 1 mes / fines de semana" style={{ width: "100%" }} />
              </div>
              {cardSaveError && <p style={{ color: "crimson", margin: 0 }}>{cardSaveError}</p>}
              {cardSaveSuccess && <p style={{ color: "#2d8a52", margin: 0 }}>Ficha guardada correctamente.</p>}
              <button type="submit" className="btn btn-primary" disabled={cardSaving}>
                {cardSaving ? "Guardando…" : "Guardar ficha"}
              </button>
            </form>
          )}
        </div>
      )}
    </main>
  );
}

// ── Sincronización reactiva con localStorage ──
function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener("nexova:auth-changed", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("nexova:auth-changed", callback);
  };
}
function getToken(): string | null {
  return getAuthToken();
}