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
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mi cuenta</h1>
          <p className="mt-1 text-sm text-nexova-muted">{email}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-md border border-nexova-border px-3 py-2 text-sm font-medium text-nexova-text"
        >
          Cerrar sesión
        </button>
      </div>

      {isLoading ? (
        <p role="status" aria-busy="true" className="text-sm text-nexova-muted">
          Cargando perfil…
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="grid max-w-xl gap-5">
          <label className="grid gap-1.5 text-sm font-medium">
            Nombre
            <input
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-md border border-nexova-border bg-nexova-bg px-3 py-2 text-nexova-text"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            Teléfono
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="rounded-md border border-nexova-border bg-nexova-bg px-3 py-2 text-nexova-text"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            Dirección
            <input
              name="address"
              autoComplete="street-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="rounded-md border border-nexova-border bg-nexova-bg px-3 py-2 text-nexova-text"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="text-sm text-emerald-700">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-fit rounded-md bg-nexova-text px-4 py-2.5 font-semibold text-nexova-bg disabled:opacity-60"
          >
            {isSaving ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      )}
    </main>
  );
}
