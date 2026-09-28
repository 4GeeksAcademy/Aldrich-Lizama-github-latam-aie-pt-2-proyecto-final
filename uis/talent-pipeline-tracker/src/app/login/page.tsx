"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { getAuthApiBaseUrl, useAuth } from "@/context/AuthContext";

interface LoginResponse {
  access_token?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${getAuthApiBaseUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email.trim(), password }),
      });

      const result = (await response
        .json()
        .catch(() => null)) as LoginResponse | null;
      if (!response.ok || !result?.access_token) {
        const detail = (result as { detail?: unknown } | null)?.detail;
        setError(
          response.status === 401
            ? "Correo electrónico o contraseña incorrectos."
            : typeof detail === "string"
              ? detail
              : "No se pudo iniciar sesión. Inténtalo de nuevo.",
        );
        return;
      }

      login(result.access_token);
      router.replace("/");
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHydrated) return <main role="status">Preparando formulario…</main>;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-3xl font-bold">Iniciar sesión</h1>
      <p className="mt-2 text-sm text-nexova-muted">
        Accede a las herramientas internas de Nexova.
      </p>

      <form method="post" onSubmit={handleSubmit} className="mt-8 grid gap-5">
        <label className="grid gap-1.5 text-sm font-medium">
          Correo electrónico
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
            className="rounded-md border border-nexova-border bg-nexova-bg px-3 py-2 text-nexova-text"
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium">
          Contraseña
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(null);
            }}
            className="rounded-md border border-nexova-border bg-nexova-bg px-3 py-2 text-nexova-text"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-nexova-text px-4 py-2.5 font-semibold text-nexova-bg disabled:opacity-60"
        >
          {isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
        </button>
      </form>
    </main>
  );
}
