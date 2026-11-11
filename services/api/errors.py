"""Handlers comunes de errores HTTP para los entrypoints de services.

Uso:
    from services.api.errors import unhandled_exception_handler
    app.add_exception_handler(Exception, unhandled_exception_handler)
"""

import logging

from fastapi import Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("nexova.api")


async def unhandled_exception_handler(
    request: Request,
    exception: Exception,
) -> JSONResponse:
    """Devuelve un error genérico sin serializar mensajes ni stack traces.

    Registra la excepción completa en los logs para depuración interna
    pero expone solo un mensaje genérico al cliente. Evita fugas de
    información sensible (stack traces, rutas internas, valores de
    configuración).
    """
    logger.exception(
        "Unhandled exception processing %s %s",
        request.method,
        request.url.path,
        exc_info=exception,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor."},
    )