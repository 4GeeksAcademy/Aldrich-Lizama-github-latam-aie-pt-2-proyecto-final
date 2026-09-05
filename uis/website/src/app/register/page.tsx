"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { API_BASE_URL } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || success) return;

    setError(null);

    // ── Validaciones en cliente ──
    if (!email.includes("@") || !email.includes(".")) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const body: Record<string, string> = {
        email: email.trim(),
        password,
      };
      if (name.trim()) body.name = name.trim();
      if (phone.trim()) body.phone = phone.trim();

      const res = await fetch(`${API_BASE_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 409) {
        const data = await res.json();
        setError(data.detail ?? "El email ya está registrado.");
        return;
      }
      if (res.status === 422) {
        const data = await res.json();
        setError(data.detail ?? "Algunos datos no son válidos.");
        return;
      }
      if (!res.ok) {
        setError("Ocurrió un error al registrar. Inténtalo de nuevo.");
        return;
      }

      // ── Éxito: redirige a /login ──
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="container section" style={{ maxWidth: 560 }}>
        <h1 style={{ marginTop: 0 }}>¡Registro exitoso!</h1>
        <div
          className="card"
          style={{ padding: "1rem", borderColor: "#2d8a52" }}
          role="status"
        >
          <strong>Tu cuenta ha sido creada correctamente.</strong>
          <p>Serás redirigido a la página de inicio de sesión en unos segundos.</p>
          <p style={{ marginBottom: 0, textAlign: "center" }}>
            <Link className="btn btn-secondary" href="/login">
              Ir a iniciar sesión
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container section" style={{ maxWidth: 460 }}>
      <h1 style={{ marginTop: 0 }}>Crear cuenta</h1>
      <p style={{ color: "var(--muted)" }}>
        Regístrate para acceder a los servicios de Nexova.
      </p>

      <form
        onSubmit={onSubmit}
        className="card"
        style={{ padding: "1rem", display: "grid", gap: "0.9rem" }}
      >
        <div>
          <label htmlFor="name">Nombre completo</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre (opcional)"
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label htmlFor="email">Correo electrónico *</label>
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
          <label htmlFor="phone">Teléfono</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+34 600 000 000 (opcional)"
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label htmlFor="password">Contraseña *</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword">Confirmar contraseña *</label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        {error ? (
          <p style={{ color: "crimson", margin: 0 }} role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Registrando…" : "Crear cuenta"}
        </button>

        <p
          style={{
            margin: 0,
            fontSize: "0.95rem",
            textAlign: "center",
          }}
        >
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            style={{ color: "var(--brand-hover)", fontWeight: 600 }}
          >
            Inicia sesión
          </Link>
        </p>
      </form>
    </main>
  );
}