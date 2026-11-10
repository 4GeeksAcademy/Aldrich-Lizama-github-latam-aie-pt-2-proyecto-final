#!/usr/bin/env python3
"""
email.py — Nexova API · Servicio de Correos Transaccionales
==============================================================
Envía correos electrónicos transaccionales usando la API HTTP
de Resend (https://resend.com).

Configuración vía variables de entorno (.env):
  - EMAIL_SERVICE_API_KEY  → Clave API de Resend
  - EMAIL_FROM             → Remitente verificado
  - FRONTEND_URL           → Base URL del frontend para enlaces

Requerimientos:
  pip install httpx

Uso:
    from app.core.email import send_reset_password_email

    await send_reset_password_email(
        email_to="usuario@nexova.com",
        reset_url="http://localhost:3000/reset-password?token=abc123",
    )
"""

import os
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

# ── Configuración desde environment ──────────────────────────
EMAIL_SERVICE_API_KEY: str = os.getenv("EMAIL_SERVICE_API_KEY", "")
EMAIL_FROM: str = os.getenv("EMAIL_FROM", "onboarding@resend.dev")
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

_RESEND_API_URL = "https://api.resend.com/emails"


# ══════════════════════════════════════════════════════════════
#  Plantilla HTML para restablecimiento de contraseña
# ══════════════════════════════════════════════════════════════


def _build_reset_html(reset_url: str) -> str:
    """Construye el cuerpo HTML responsivo para el correo de reset.

    Args:
        reset_url: Enlace completo con token para restablecer.

    Returns:
        String HTML formateado con diseño responsivo.
    """
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #e1e2de;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }}
    .container {{
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }}
    .card {{
      background: #ffffff;
      border-radius: 12px;
      padding: 32px 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }}
    h1 {{
      color: #11303f;
      font-size: 24px;
      margin: 0 0 8px;
    }}
    p {{
      color: #2f4f5f;
      font-size: 16px;
      line-height: 1.5;
      margin: 12px 0;
    }}
    .btn {{
      display: inline-block;
      background-color: #11303f;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      margin: 16px 0;
    }}
    .btn:hover {{
      background-color: #456b79;
    }}
    .footer {{
      margin-top: 24px;
      font-size: 13px;
      color: #8aa598;
      text-align: center;
    }}
    @media only screen and (max-width: 480px) {{
      .card {{ padding: 24px 16px; }}
      h1 {{ font-size: 20px; }}
      .btn {{ display: block; text-align: center; }}
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Restablecimiento de contrase&ntilde;a</h1>
      <p>Hemos recibido una solicitud para restablecer la contrase&ntilde;a de tu cuenta en <strong>Nexova</strong>.</p>
      <p>Haz clic en el siguiente bot&oacute;n para crear una nueva contrase&ntilde;a:</p>
      <p style="text-align:center">
        <a href="{reset_url}" class="btn" target="_blank">
          Restablecer contrase&ntilde;a
        </a>
      </p>
      <p>Si no solicitaste este cambio, puedes ignorar este correo. El enlace expirar&aacute; en 30 minutos.</p>
      <p style="font-size:14px; color:#8aa598;">
        Si el bot&oacute;n no funciona, copia y pega este enlace en tu navegador:<br />
        <span style="word-break:break-all; color:#456b79;">{reset_url}</span>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Nexova &mdash; Consultora de Recursos Humanos y Talento</p>
    </div>
  </div>
</body>
</html>"""


# ══════════════════════════════════════════════════════════════
#  Envío de correo transaccional
# ══════════════════════════════════════════════════════════════


async def send_reset_password_email(
    email_to: str,
    reset_url: str,
    *,
    api_key: Optional[str] = None,
    from_addr: Optional[str] = None,
) -> dict:
    """Envía un correo de restablecimiento de contraseña vía Resend API.

    Args:
        email_to: Destinatario del correo.
        reset_url: Enlace completo con el token de restablecimiento.
        api_key: Clave API de Resend (opcional, por defecto de env).
        from_addr: Dirección remitente (opcional, por defecto de env).

    Returns:
        Respuesta JSON de la API de Resend.

    Raises:
        RuntimeError: Si no hay API key configurada.
        httpx.HTTPStatusError: Si la API responde con error.
    """
    key = api_key or EMAIL_SERVICE_API_KEY
    sender = from_addr or EMAIL_FROM

    if not key:
        raise RuntimeError(
            "EMAIL_SERVICE_API_KEY no está configurada. "
            "Configúrala en .env o pásala como parámetro."
        )

    import httpx

    html_body = _build_reset_html(reset_url)

    payload = {
        "from": sender,
        "to": [email_to],
        "subject": "Restablece tu contraseña — Nexova",
        "html": html_body,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            _RESEND_API_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
        )
        response.raise_for_status()
        return response.json()