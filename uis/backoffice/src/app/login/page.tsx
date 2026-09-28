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
    <main className="wrapper" style={{ maxWidth: 480, padding: "3rem 0" }}>
      <h1 style={{ marginTop: 0 }}>Iniciar sesión</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Accede a las herramientas internas de Nexova.
      </p>

      <form
        method="post"
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: "1rem" }}
      >
        <label style={{ display: "grid", gap: "0.35rem" }}>
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
          />
        </label>

        <label style={{ display: "grid", gap: "0.35rem" }}>
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
          />
        </label>

        {error && (
          <p role="alert" style={{ color: "#b42318", margin: 0 }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
        </button>
      </form>
    </main>
  );
}
