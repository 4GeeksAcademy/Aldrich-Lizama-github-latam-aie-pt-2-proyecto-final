"use client";

import Link from "next/link";
import { FormEvent, useState, useSyncExternalStore } from "react";

import { API_BASE_URL } from "@/lib/api";
import { clearAuthToken, getAuthToken } from "@/lib/auth";

type ChangePasswordResponse = {
  message: string;
};

type ErrorResponse = {
  detail?: string;
};

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  // Lee el token de forma segura para hidratación: en el servidor
  // devuelve null y en el cliente se sincroniza con localStorage.
  const hasToken = useSyncExternalStore(subscribe, getToken, () => null) !== null;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || success) return;

    setError(null);

    // ── Validación en cliente antes de llamar a la API ──
    if (!hasToken) {
      setError("Debes iniciar sesión para cambiar tu contraseña.");
      return;
    }
    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (res.status === 400) {
        // Muestra el mensaje exacto del backend (contraseña actual
        // incorrecta). Si no llega detail, usamos uno genérico.
        const data = (await res.json().catch(() => ({}))) as ErrorResponse;
        setError(
          data.detail ??
            "La contraseña actual no es correcta. Verifica e inténtalo de nuevo.",
        );
        return;
      }

      if (res.status === 401) {
        // Token ausente, inválido o expirado.
        clearAuthToken();
        setError("Tu sesión ha expirado. Vuelve a iniciar sesión.");
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as ErrorResponse;
        setError(data.detail ?? "Ocurrió un error al cambiar la contraseña.");
        return;
      }

      // ── Éxito: limpia campos y muestra la alerta ──
      const data = (await res.json()) as ChangePasswordResponse;
      console.debug("Change password OK –", data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
      setError(null);
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ── Sin sesión (no hay token JWT) ───────────────────────────
  if (!hasToken) {
    return (
      <main className="container section" style={{ maxWidth: 460 }}>
        <h1 style={{ marginTop: 0 }}>Cambiar contraseña</h1>
        <div className="card" style={{ padding: "1rem" }} role="alert">
          <strong>Necesitas iniciar sesión.</strong>
          <p>
            Para cambiar tu contraseña debes estar autenticado en tu cuenta.
          </p>
          <p style={{ marginBottom: 0, textAlign: "center" }}>
            <Link className="btn btn-primary" href="/login">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </main>
    );
  }

  // ── Éxito: alerta/toast con el mensaje solicitado ───────────
  if (success) {
    return (
      <main className="container section" style={{ maxWidth: 560 }}>
        <h1 style={{ marginTop: 0 }}>Cambiar contraseña</h1>
        <div
          className="card"
          style={{ padding: "1rem", borderColor: "#2d8a52" }}
          role="status"
        >
          <strong>Tu contraseña ha sido actualizada correctamente.</strong>
          <p>
            A partir de ahora deberás usar tu nueva contraseña al iniciar
            sesión.
          </p>
          <p style={{ marginBottom: 0, textAlign: "center" }}>
            <Link
              className="btn btn-secondary"
              href="/login"
              onClick={() => {
                // Limpia el token de la sesión local: el resto del
                // sistema aún usa la contraseña anterior hasta que
                // el usuario vuelva a iniciar sesión.
                clearAuthToken();
              }}
            >
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container section" style={{ maxWidth: 460 }}>
      <h1 style={{ marginTop: 0 }}>Cambiar contraseña</h1>
      <p style={{ color: "var(--muted)" }}>
        Para tu seguridad, confirma tu contraseña actual y define una nueva.
      </p>

      <form
        onSubmit={onSubmit}
        className="card"
        style={{ padding: "1rem", display: "grid", gap: "0.9rem" }}
      >
        <div>
          <label htmlFor="currentPassword">Contraseña actual *</label>
          <input
            id="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            disabled={loading}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label htmlFor="newPassword">Nueva contraseña *</label>
          <input
            id="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            disabled={loading}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword">Confirmar nueva contraseña *</label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            disabled={loading}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        {error ? (
          <div
            className="card"
            style={{ padding: "0.8rem", borderColor: "crimson" }}
            role="alert"
          >
            <p style={{ margin: 0, color: "crimson" }}>{error}</p>
          </div>
        ) : null}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Guardando…" : "Actualizar contraseña"}
        </button>

        <p style={{ margin: 0, textAlign: "center", fontSize: "0.95rem" }}>
          <Link
            href="/"
            style={{ color: "var(--brand-hover)", fontWeight: 600 }}
          >
            Volver al inicio
          </Link>
        </p>
      </form>
    </main>
  );
}

// ── Suscripción a localStorage para useSyncExternalStore ────
// Escucha el evento "storage" (disparado entre pestañas) y el
// evento "nexova:auth-changed" (custom, para cambios locales).
function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onChange);
  window.addEventListener("nexova:auth-changed", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("nexova:auth-changed", onChange);
  };
}

/** Devuelve el token actual (snapshot para useSyncExternalStore). */
function getToken(): string | null {
  return getAuthToken();
}