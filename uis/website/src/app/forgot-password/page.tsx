"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { API_BASE_URL } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitted || loading) return; // Evita peticiones duplicadas

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        setError(
          "Ocurrió un error al procesar la solicitud. Inténtalo de nuevo.",
        );
        setLoading(false);
        return;
      }

      // La API siempre responde 200: no revela si el email existe.
      // Deshabilitamos el formulario para prevenir reenvíos duplicados.
      setSubmitted(true);
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="container section" style={{ maxWidth: 560 }}>
        <h1 style={{ marginTop: 0 }}>Revisa tu correo</h1>
        <div
          className="card"
          style={{ padding: "1rem", borderColor: "#2d8a52" }}
          role="status"
        >
          <strong>Solicitud enviada.</strong>
          <p>
            Si esa dirección está registrada en nuestro sistema, recibirás un
            enlace de restablecimiento en breve.
          </p>
          <p style={{ marginBottom: 0, textAlign: "center" }}>
            <Link className="btn btn-secondary" href="/login">
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container section" style={{ maxWidth: 460 }}>
      <h1 style={{ marginTop: 0 }}>Recuperar contraseña</h1>
      <p style={{ color: "var(--muted)" }}>
        Ingresa el correo de tu cuenta y te enviaremos un enlace para
        restablecer tu contraseña.
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
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        {error ? (
          <p style={{ color: "crimson", margin: 0 }} role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Enviando…" : "Enviar enlace de recuperación"}
        </button>

        <p style={{ margin: 0, textAlign: "center", fontSize: "0.95rem" }}>
          <Link
            href="/login"
            style={{ color: "var(--brand-hover)", fontWeight: 600 }}
          >
            Volver a iniciar sesión
          </Link>
        </p>
      </form>
    </main>
  );
}