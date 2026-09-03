"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { API_BASE_URL } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasToken = token.length > 0;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || success) return;

    setError(null);

    // ── Validación en cliente: las contraseñas deben coincidir ──
    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (res.status === 400) {
        setError(
          "El enlace de restablecimiento es inválido o ha expirado. Solicita uno nuevo.",
        );
        return;
      }

      if (!res.ok) {
        setError("Ocurrió un error al restablecer la contraseña. Inténtalo de nuevo.");
        return;
      }

      // ── Éxito: redirige a /login tras 2 segundos ──
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ── Sin token en la URL ─────────────────────────────────────
  if (!hasToken) {
    return (
      <main className="container section" style={{ maxWidth: 460 }}>
        <h1 style={{ marginTop: 0 }}>Restablecer contraseña</h1>
        <div className="card" style={{ padding: "1rem" }} role="alert">
          <strong>Enlace inválido.</strong>
          <p>
            No se encontró un token de restablecimiento en la dirección.
          </p>
          <p style={{ marginBottom: 0, textAlign: "center" }}>
            <Link className="btn btn-secondary" href="/forgot-password">
              Solicitar un nuevo enlace
            </Link>
          </p>
        </div>
      </main>
    );
  }

  // ── Éxito ───────────────────────────────────────────────────
  if (success) {
    return (
      <main className="container section" style={{ maxWidth: 560 }}>
        <h1 style={{ marginTop: 0 }}>Contraseña actualizada</h1>
        <div
          className="card"
          style={{ padding: "1rem", borderColor: "#2d8a52" }}
          role="status"
        >
          <strong>Tu contraseña se actualizó correctamente.</strong>
          <p>Serás redirigido a la página de inicio de sesión…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container section" style={{ maxWidth: 460 }}>
      <h1 style={{ marginTop: 0 }}>Restablecer contraseña</h1>
      <p style={{ color: "var(--muted)" }}>
        Crea una nueva contraseña para tu cuenta.
      </p>

      <form
        onSubmit={onSubmit}
        className="card"
        style={{ padding: "1rem", display: "grid", gap: "0.9rem" }}
      >
        <div>
          <label htmlFor="newPassword">Nueva contraseña *</label>
          <input
            id="newPassword"
            type="password"
            required
            minLength={8}
            disabled={loading}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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
            <p style={{ marginBottom: 0, textAlign: "center" }}>
              <Link
                href="/forgot-password"
                style={{ color: "var(--brand-hover)", fontWeight: 600 }}
              >
                Solicitar un nuevo enlace
              </Link>
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Guardando…" : "Restablecer contraseña"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="container section">Cargando…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}