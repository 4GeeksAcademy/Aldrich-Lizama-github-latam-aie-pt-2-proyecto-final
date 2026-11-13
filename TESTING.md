# Plan y ejecución de pruebas

## Enfoque

Las suites nuevas invocan funciones de endpoints directamente y prueban decisiones de negocio, con persistencia aislada en TinyDB temporal y servicios externos simulados. No prueban el enrutamiento, la serialización de respuestas ni el ciclo HTTP de FastAPI. Los schemas Pydantic se validan directamente para cubrir campos vacíos y límites.

## Matriz de casos planificados

| Endpoint o función | Camino feliz | Caso límite | Modo de fallo y motivo |
|---|---|---|---|
| `POST /users/` (registro) | Normaliza email, crea usuario y no devuelve el hash | Contraseña de exactamente 8 caracteres y espacios alrededor del email | Email inválido, contraseña vacía/corta, email duplicado y fallo inesperado de persistencia |
| `POST /auth/login` | Credenciales válidas producen un token verificable | Usuario sin `is_active` explícito se considera activo | Usuario inexistente, contraseña incorrecta y cuenta desactivada |
| `GET /auth/me` | Proyecta los campos del usuario autenticado | Perfil ausente se representa como `None` | Principal incompleto incumple el contrato que debe proveer la dependencia |
| `POST /auth/forgot-password` | Usuario existente genera token aleatorio, persiste solo su hash y solicita email | Email no registrado conserva respuesta genérica anti-enumeración | Fallos HTTP, de conexión o configuración del correo no filtran existencia ni interrumpen la respuesta pública |
| `POST /auth/reset-password` | Token vigente actualiza contraseña y queda consumido | Token usado no se puede reutilizar; contraseña nueva acepta el mínimo de 8 caracteres | Token desconocido, expirado o contraseña por debajo del mínimo |
| `POST /auth/change-password` | Contraseña actual correcta actualiza el hash | Contraseña nueva de longitud mínima; contraseña actual vacía se rechaza por schema | Contraseña actual incorrecta y campos de contraseña vacíos |
| `create_access_token` / `get_current_user` | JWT firmado contiene `sub`, rol y expiración; dependencia devuelve usuario existente | Duración explícita de token y usuario activo | JWT expirado o malformado, `sub` ausente/no numérico, usuario inexistente o desactivado |
| Aplicaciones: listar, crear, leer ficha, upsert, actualizar y borrar | CRUD y aislamiento por `user_id` | Lista vacía, actualización sin cambios y ficha inicialmente inexistente | Postulación inexistente o perteneciente a otra persona; schema con título vacío/estado inválido |
| Proveedores: crear, listar, obtener, actualizar tarifa/estado y soft-delete | Cambios persisten y soft-delete excluye el proveedor del listado | Filtros combinados y listado sin resultados | ID inexistente/eliminado; tarifa no positiva y payload inválido |
| `fetchSuppliers` (Jest) | Devuelve resultados y construye filtros de query | Sin filtros no añade query string | Rechaza respuesta no-OK con mensaje de error del servicio |
| `createSupplier` (Jest) | Envía POST con JSON y devuelve proveedor | Campos opcionales no alteran el envío requerido | Rechaza respuesta no-OK |
| `deleteSupplier` (Jest) | Envía DELETE y acepta respuesta `204` sin contenido | Trata correctamente `204` como ausencia de cuerpo | Rechaza respuesta no-OK |

## Suites

- `tests/test_register.py`, `tests/test_login.py`, `tests/test_auth_me.py`, `tests/test_forgot_password.py`, `tests/test_password_reset.py` y `tests/test_change_password.py`: endpoints de autenticación y registro, invocados directamente.
- `tests/test_token.py`: creación JWT y validación de la dependencia `get_current_user`, incluyendo expiración y tokens malformados.
- `tests/test_applications.py` y `tests/test_suppliers.py`: dos grupos de endpoints de negocio para API-042.
- `uis/backoffice/__tests__/suppliers-api.test.ts`: tres helpers TypeScript del cliente de proveedores para FE-019.

## Comandos

Desde la raíz, instala las dependencias de desarrollo de Python con `uv sync --group dev` y ejecuta:

```bash
uv run pytest
uv run pytest --cov=app.api.auth --cov-report=term-missing --cov-fail-under=70
```

La cobertura se exige sobre `app/api/auth.py` (mínimo 70%). Las suites de backoffice fijan su propio umbral de 60% para `app/api/applications.py` y `services/api/routes/suppliers.py`.

Para la suite TypeScript, desde `uis/backoffice/`:

```bash
npm install
npx jest --coverage
```

## Resultados

## Resultados

### Python (pytest)

Ejecutado con `uv run pytest` — 46 pruebas, todas pasando.

| Módulo | Pruebas | Cobertura | Estado |
|---|---|---|---|
| `app/api/auth.py` (AUTH-088) | `test_register`, `test_login`, `test_auth_me`, `test_forgot_password`, `test_change_password`, `test_password_reset` | **100%** (umbral 70%) ✅ | 46/46 |
| `app/api/applications.py` (API-042) | `test_applications` | **100%** (umbral 60%) ✅ | 5/5 |
| `services/api/routes/suppliers.py` (API-042) | `test_suppliers` | **99%** (umbral 60%) ✅ | 4/4 |

*Housekeeping: se agregaron las dependencias `email-validator` y `python-multipart` a `pyproject.toml` y se configuró `[tool.pytest.ini_options]` con `pythonpath = ["."]` para resolución de imports.*

### TypeScript (Jest)

Ejecutado con `npx jest --coverage` desde `uis/backoffice/`.

| Archivo | Pruebas | Cobertura | Estado |
|---|---|---|---|
| `src/app/suppliers/api.ts` (FE-019) | `suppliers-api.test.ts` | **75.86%** (statements) ✅ | 6/6 |

### Bugs descubiertos y corregidos

1. **`app/api/users.py` — NameError por logger no definido**: la cláusula `except Exception` llamaba a `logger.exception()` sin que la variable `logger` estuviera importada o definida. Cualquier fallo de E/S por `OSError` de la ruta privada de persistencia se metamorfoseaba en `NameError`, impidiendo la sanitización HTTP 500. Fijo: se agregó `logger = logging.getLogger("nexova.users")` tras la definición del router."
