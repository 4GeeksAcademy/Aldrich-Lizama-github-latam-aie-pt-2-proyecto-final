"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { getAuthApiBaseUrl, useAuth } from "@/context/AuthContext";

type RegisterField = "email" | "password" | "name" | "phone" | "address";
type FieldErrors = Partial<Record<RegisterField, string>>;

interface ApiValidationError {
  loc?: Array<string | number>;
  msg?: string;
}

function readApiErrors(payload: unknown): {
  fields: FieldErrors;
  form: string | null;
} {
  const detail = (payload as { detail?: unknown } | null)?.detail;
  const fields: FieldErrors = {};

  if (Array.isArray(detail)) {
    for (const issue of detail as ApiValidationError[]) {
      const field = issue.loc?.at(-1);
      if (
        typeof field === "string" &&
        ["email", "password", "name", "phone", "address"].includes(field)
      ) {
        fields[field as RegisterField] = issue.msg ?? "Revisa este campo.";
      }
    }
    return {
      fields,
      form: Object.keys(fields).length ? null : "Revisa los datos ingresados.",
    };
  }

  if (typeof detail === "string") {
    const target = /email|correo/i.test(detail)
      ? "email"
      : /password|contraseña/i.test(detail)
        ? "password"
        : null;
    if (target) fields[target] = detail;
    return { fields, form: target ? null : detail };
  }

  return {
    fields,
    form: "No se pudo completar el registro. Inténtalo de nuevo.",
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (field: RegisterField) => {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    const baseUrl = getAuthApiBaseUrl();
    try {
      const registerResponse = await fetch(`${baseUrl}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        }),
      });

      if (!registerResponse.ok) {
        const payload: unknown = await registerResponse
          .json()
          .catch(() => null);
        const errors = readApiErrors(payload);
        setFieldErrors(errors.fields);
        setFormError(errors.form);
        return;
      }

      const loginResponse = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email.trim(), password }),
      });

      if (!loginResponse.ok) {
        const payload: unknown = await loginResponse.json().catch(() => null);
        const errors = readApiErrors(payload);
        setFieldErrors(errors.fields);
        setFormError(
          errors.form ??
            "La cuenta se creó, pero no se pudo iniciar sesión automáticamente.",
        );
        return;
      }

      const result = (await loginResponse.json()) as { access_token: string };
      login(result.access_token);
      router.replace("/");
    } catch {
      setFormError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isHydrated) return <main role="status">Preparando formulario…</main>;

  return (
    <main className="wrapper" style={{ maxWidth: 560, padding: "3rem 0" }}>
      <h1 style={{ marginTop: 0 }}>Crear cuenta</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Regístrate para acceder a las herramientas internas de Nexova.
      </p>

      <form
        method="post"
        onSubmit={handleSubmit}
        noValidate
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
              clearFieldError("email");
            }}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={
              fieldErrors.email ? "register-email-error" : undefined
            }
          />
          {fieldErrors.email && (
            <span
              id="register-email-error"
              role="alert"
              style={{ color: "#b42318" }}
            >
              {fieldErrors.email}
            </span>
          )}
        </label>

        <label style={{ display: "grid", gap: "0.35rem" }}>
          Contraseña
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearFieldError("password");
            }}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? "register-password-error" : undefined
            }
          />
          {fieldErrors.password && (
            <span
              id="register-password-error"
              role="alert"
              style={{ color: "#b42318" }}
            >
              {fieldErrors.password}
            </span>
          )}
        </label>

        <label style={{ display: "grid", gap: "0.35rem" }}>
          Nombre <span style={{ color: "var(--muted)" }}>(opcional)</span>
          <input
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              clearFieldError("name");
            }}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={
              fieldErrors.name ? "register-name-error" : undefined
            }
          />
          {fieldErrors.name && (
            <span
              id="register-name-error"
              role="alert"
              style={{ color: "#b42318" }}
            >
              {fieldErrors.name}
            </span>
          )}
        </label>

        <label style={{ display: "grid", gap: "0.35rem" }}>
          Teléfono <span style={{ color: "var(--muted)" }}>(opcional)</span>
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              clearFieldError("phone");
            }}
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={
              fieldErrors.phone ? "register-phone-error" : undefined
            }
          />
          {fieldErrors.phone && (
            <span
              id="register-phone-error"
              role="alert"
              style={{ color: "#b42318" }}
            >
              {fieldErrors.phone}
            </span>
          )}
        </label>

        <label style={{ display: "grid", gap: "0.35rem" }}>
          Dirección <span style={{ color: "var(--muted)" }}>(opcional)</span>
          <input
            name="address"
            autoComplete="street-address"
            value={address}
            onChange={(event) => {
              setAddress(event.target.value);
              clearFieldError("address");
            }}
            aria-invalid={Boolean(fieldErrors.address)}
            aria-describedby={
              fieldErrors.address ? "register-address-error" : undefined
            }
          />
          {fieldErrors.address && (
            <span
              id="register-address-error"
              role="alert"
              style={{ color: "#b42318" }}
            >
              {fieldErrors.address}
            </span>
          )}
        </label>

        {formError && (
          <div role="alert" style={{ color: "#b42318", margin: 0 }}>
            <p style={{ margin: 0 }}>{formError}</p>
            <button className="btn btn-link" onClick={() => setFormError(null)} style={{ marginTop: "0.3rem", padding: 0, border: "none", background: "none", color: "var(--primary)", textDecoration: "underline", cursor: "pointer" }}>
              Reintentar
            </button>
          </div>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>
    </main>
  );
}
