"""Handlers comunes de errores HTTP para los entrypoints de services."""

from fastapi import Request
from fastapi.responses import JSONResponse


async def unhandled_exception_handler(
    request: Request,
    exception: Exception,
) -> JSONResponse:
    """Devuelve un error genérico sin serializar mensajes ni stack traces."""
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor."},
    )