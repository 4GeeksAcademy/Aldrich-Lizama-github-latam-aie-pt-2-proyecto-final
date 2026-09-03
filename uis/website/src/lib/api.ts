// ────────────────────────────────────────────────────────────
//  lib/api.ts — Capa de comunicación con la API de Nexova
// ────────────────────────────────────────────────────────────
//  Resuelve la URL base del backend automáticamente:
//   - Variable NEXT_PUBLIC_API_URL si está definida por el usuario.
//   - En Codespaces (.app.github.dev) deduce la URL pública del
//     puerto 8000 a partir del hostname de la preview.
//   - En local usa http://localhost:8000 por defecto.
// ────────────────────────────────────────────────────────────

export function getApiBaseUrl(): string {
  // Si el usuario configuró explícitamente la variable, usarla
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Detectar Codespaces por el hostname
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Ejemplo: super-duper-space-tribble-xrwx94wrxvvphvwq6-3000.app.github.dev
    if (host.endsWith(".app.github.dev")) {
      // El hostname es: "{codespace-name}-{port}.app.github.dev"
      // Extraemos la parte antes del último '-' que precede al puerto
      const lastDash = host.lastIndexOf("-");
      const dotIndex = host.indexOf(".");
      if (lastDash > 0 && dotIndex > lastDash) {
        const baseName = host.slice(0, lastDash); // todo antes del puerto
        return `https://${baseName}-8000.app.github.dev`;
      }
    }
  }

  return "http://localhost:8000";
}

/** URL base de la API (resuelta una sola vez al cargar el módulo). */
export const API_BASE_URL = getApiBaseUrl();