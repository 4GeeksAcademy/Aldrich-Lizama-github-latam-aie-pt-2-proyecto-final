"use client";

import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/apiClient";

interface CurrentUser {
  email: string;
  profile: {
    name: string | null;
    phone: string | null;
    address: string | null;
  } | null;
}

interface ProfileResponse {
  name: string | null;
  phone: string | null;
  address: string | null;
}

async function responseError(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as {
    detail?: unknown;
  } | null;
  return typeof payload?.detail === "string"
    ? payload.detail
    : "No se pudieron guardar los cambios. Inténtalo de nuevo.";
}

export default function AccountProfilePage() {
  const { isLoading: authLoading, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient("/auth/me");
        if (!response.ok) throw new Error(await responseError(response));
        const currentUser = (await response.json()) as CurrentUser;
        if (cancelled) return;

        setEmail(currentUser.email);
        setName(currentUser.profile?.name ?? "");
        setPhone(currentUser.profile?.phone ?? "");
        setAddress(currentUser.profile?.address ?? "");
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "No se pudo cargar tu perfil.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [authLoading]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await apiClient("/profiles/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));

      const updated = (await response.json()) as ProfileResponse;
      setName(updated.name ?? "");
      setPhone(updated.phone ?? "");
      setAddress(updated.address ?? "");
      setSuccess("Perfil actualizado correctamente.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudieron guardar los cambios.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="wrapper" style={{ maxWidth: 640, padding: "2rem 0" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Mi cuenta</h1>
          <p style={{ color: "var(--muted)", marginBottom: 0 }}>{email}</p>
        </div>
        <button type="button" onClick={logout}>
          Cerrar sesión
        </button>
      </div>

      {isLoading ? (
        <p role="status" aria-busy="true">
          Cargando perfil…
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gap: "1rem", maxWidth: 520 }}
        >
          <label style={{ display: "grid", gap: "0.35rem" }}>
            Nombre
            <input
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label style={{ display: "grid", gap: "0.35rem" }}>
            Teléfono
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>

          <label style={{ display: "grid", gap: "0.35rem" }}>
            Dirección
            <input
              name="address"
              autoComplete="street-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </label>

          {error && (
            <p role="alert" style={{ color: "#b42318", margin: 0 }}>
              {error}
            </p>
          )}
          {success && (
            <p role="status" style={{ color: "#16794b", margin: 0 }}>
              {success}
            </p>
          )}

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      )}
    </main>
  );
}
