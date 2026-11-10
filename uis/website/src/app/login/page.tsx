"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { API_BASE_URL } from "@/lib/api";
import { setAuthToken } from "@/lib/auth";

type LoginResponse = {
  access_token: string;
  token_type: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // OAuth2PasswordRequestForm espera application/x-www-form-urlencoded
      const body = new URLSearchParams();
      body.append("username", email.trim());
      body.append("password", password);

      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (!res.ok) {
        setError("Email o contraseña incorrectos.");
        return;
      }

      const data = (await res.json()) as LoginResponse;

      // Persiste el token JWT para las peticiones autenticadas
      // (por ejemplo /account/change-password).
      setAuthToken(data.access_token);

      // Redirige al perfil personal tras un login exitoso.
      router.push("/account/profile");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container section" style={{ maxWidth: 460 }}>
      <h1 style={{ marginTop: 0 }}>Iniciar sesión</h1>
      <p style={{ color: "var(--muted)" }}>
        Accede a tu cuenta de Nexova para continuar.
      </p>

      <form
        onSubmit={onSubmit}
        className="card"
        style={{ padding: "1rem", display: "grid", gap: "0.9rem" }}
      >
        <div>
          <label htmlFor="email">Email *</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label htmlFor="password">Contraseña *</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        {error ? (
          <p style={{ color: "crimson", margin: 0 }} role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Ingresando…" : "Iniciar sesión"}
        </button>

        <p
          style={{
            margin: 0,
            fontSize: "0.95rem",
            textAlign: "center",
          }}
        >
          <Link
            href="/forgot-password"
            style={{ color: "var(--brand-hover)", fontWeight: 600 }}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </p>

        <p
          style={{
            margin: 0,
            fontSize: "0.95rem",
            textAlign: "center",
          }}
        >
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            style={{ color: "var(--brand-hover)", fontWeight: 600 }}
          >
            Regístrate aquí
          </Link>
        </p>
      </form>
    </main>
  );
}