# Progress — Nexova AI Engineering Project

> **Branch activo:** `Restablecimiento_de_Contraseña` (rama de trabajo actual — AUTH-03)
> **Último commit (rama activa):** `c3b08b6` — "test(auth): pruebas pytest para flujo AUTH-03 de contraseña" — head de `Restablecimiento_de_Contraseña` (ya pusheado a origin, árbol limpio)
> **Último commit (main):** `2e8e929` — "feat: implementar API con almacenamiento ligero (TinyDB) y soft-delete de proveedores"
> **Rama AUTH-03:** `Restablecimiento_de_Contraseña` — contiene 4 commits: `29027fa` (backend), `16e948f` (frontend recovery), `3782b83` (change-password), `c3b08b6` (tests)
> **PR activo:** Ninguno
> **Fecha de actualización:** 2026-09-03

---

## 1) Estado actual de desarrollo

### ✅ Hito 1 — Sitio Web Público (completado funcionalmente)

Implementado en dos versiones:
- **Versión moderna**: `uis/website/` — Next.js 16 + React 19 + TypeScript
  - Landing page en `/` con Header, Hero, Servicios, WhyNexova, Contacto, Footer
  - Formulario de talento en `/talent` con validaciones React
  - Schema.org Organization (JSON-LD), SEO on-page, soporte ES/EN
- **Versión legacy** (mantenida por compatibilidad): `index.html`, `application.html`, `validation.js`

### ✅ Hito 2 — Fundamentos de Programación (completado)

- Interfaces `Candidate`, `Vacancy`, `SelectionProcess` en `src/types/models.ts`
- Utilidades en `src/utils/collections.ts`, `search.ts`, `transformations.ts`, `validations.ts`
- Script demo funcional: `src/demo.ts`
- Validación: `npm run typecheck` OK

### ✅ Hito 3 — Talent Pipeline Tracker (completado)

- Implementación en `uis/talent-pipeline-tracker/` (Next.js 16 SPA independiente)
- Listado, filtros, paginación, detalle, edición, eliminación, notas, creación
- SSE para actualización en tiempo real
- Dependencia de API externa (`playground.4geeks.com`)

### ✅ Análisis de Incidencias (Soporte) — Módulo completo

#### Backend Python/FastAPI

| Archivo | Descripción |
|---|---|
| `services/server.py` | API FastAPI con endpoints `/api/incidents/analyze` y `/api/incidents/results/export` + router de proveedores |
| `packages/nexova_analyzer/config.py` | Constantes: campos requeridos, categorías, patrones de validación |
| `packages/nexova_analyzer/validators.py` | Validación de campos (ticket_id, agent_id, email, fecha, score) |
| `packages/nexova_analyzer/analyzer.py` | Core: carga CSV, clasifica filas, computa métricas (`AnalysisResult`) |
| `packages/nexova_analyzer/reporters.py` | Reporte en consola y exportación CSV |
| `scripts/analyze.py` | CLI que delega en `nexova_analyzer` |

#### Frontend React (Backoffice)

| Archivo | Descripción |
|---|---|
| `uis/backoffice/src/app/incidents/page.tsx` | Página principal de análisis |
| `uis/backoffice/src/app/incidents/types.ts` | Tipos: `AnalysisResult`, `AnalysisStatus`, `InvalidRuleEntry` |
| `uis/backoffice/src/app/incidents/api.ts` | Cliente REST: `uploadAndAnalyze()`, `downloadExport()` |
| `uis/backoffice/src/app/incidents/components/CsvUploader.tsx` | Drag & drop + selector de archivos CSV |
| `uis/backoffice/src/app/incidents/components/MetricsCards.tsx` | Tarjetas: totales, válidos, inválidos |
| `uis/backoffice/src/app/incidents/components/BreakdownTable.tsx` | Tabla con barras de progreso (anti-pattern corregido) |
| `uis/backoffice/src/app/incidents/components/SatisfactionIndex.tsx` | Distribución de scores 1-5 (anti-pattern corregido) |
| `uis/backoffice/src/app/incidents/components/InvalidRecordsAlert.tsx` | Alertas de registros inválidos |
| `uis/backoffice/src/app/incidents/components/ExportButton.tsx` | Botón de exportación CSV |

### ✅ Módulo de Proveedores — NUEVO (API + Frontend + Soft-Delete)

#### Backend — API con almacenamiento ligero (TinyDB)

| Archivo | Descripción |
|---|---|
| `services/api/__init__.py` | Inicialización del paquete |
| `services/api/database.py` | Singleton TinyDB (`get_suppliers_table()`) |
| `services/api/models.py` | Modelos Pydantic v2: `SupplierCreate`, `SupplierResponse`, `SupplierRateUpdate`, `SupplierStatusUpdate` |
| `services/api/router.py` | CRUD completo: GET list (con filtros), GET by id, POST create, PUT rate, PUT status, DELETE soft-delete |
| `services/api/routes/__init__.py` | Inicialización del subpaquete |
| `services/api/routes/suppliers.py` | Router con soft-delete (setea `deleted_at` y `status="suspended"`). **5 rutas protegidas** con `Depends(get_current_user)`. |
| `services/api/seed.py` | 15 proveedores de ejemplo |
| `services/api/main.py` | Entrypoint directo para uvicorn |
| `app/main.py` | **NUEVO** Entrypoint central que integra routers `/auth`, `/users`, `/profiles` y `/suppliers`. |
| `app/__init__.py` | **NUEVO** Inicialización del paquete `app`. |
| `services/CONTEXT-nexova-APIconAlmacenamientoLigero.es.md` | Documentación del módulo |

**Endpoints disponibles (vía `uvicorn app.main:app --reload`):**
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/auth/login` | Iniciar sesión, devuelve JWT | ❌ |
| GET | `/auth/me` | Usuario autenticado | ✅ `get_current_user` |
| POST | `/users/` | Registro público de usuario | ❌ |
| GET | `/users/` | Listar todos los usuarios | ✅ |
| GET | `/users/{user_id}` | Obtener usuario por ID | ✅ |
| PUT | `/users/{user_id}` | Actualizar usuario | ✅ |
| DELETE | `/users/{user_id}` | Eliminar usuario + perfil | ✅ |
| GET | `/profiles/me` | Mi perfil | ✅ |
| PUT | `/profiles/me` | Actualizar mi perfil | ✅ |
| POST | `/suppliers` | Crear proveedor | ❌ |
| GET | `/suppliers` | Listar proveedores | ✅ |
| GET | `/suppliers/{supplier_id}` | Detalle proveedor | ✅ |
| PATCH | `/suppliers/{supplier_id}/rate` | Actualizar tarifa | ✅ |
| PATCH | `/suppliers/{supplier_id}/status` | Activar/suspender | ✅ |
| DELETE | `/suppliers/{supplier_id}` | Soft-delete proveedor | ✅ |
| GET | `/health` | Health check | ❌ |

**Características clave:**
- Soft-delete con confirmación previa (no eliminación física)
- `deleted_at` timestamp ISO en documentos eliminados
- Estado `"suspended"` al deshabilitar
- GET list filtra automáticamente proveedores eliminados
- TinyDB 4.9.0 — base de datos JSON ligera, sin servidor
- 15 seed suppliers precargados

#### Frontend — Directorio de Proveedores

| Archivo | Descripción |
|---|---|
| `uis/backoffice/src/app/suppliers/page.tsx` | Página completa (~960 líneas) con CRUD, soft-delete, filtros, modales |
| `uis/backoffice/src/app/suppliers/types.ts` | Tipos TypeScript: `Supplier`, `CreateSupplier`, `SupplierFormData` |
| `uis/backoffice/src/app/suppliers/api.ts` | Cliente REST: `fetchSuppliers()`, `createSupplier()`, `updateRate()`, `deleteSupplier()` |

**Características clave:**
- Lucide React icons para toda la iconografía
- Summary bar con 4 KPI cards (total, activos, suspendidos, tarifa promedio)
- Tabla responsive con acciones horizontales (icon-only)
- Modal de confirmación con animación (`modalIn` keyframe)
- Modal de creación/edición con formulario completo
- Modal de actualización de tarifa
- Filtro por país y categoría
- Diseño responsive (`.wrapper--wide`, `.hide-mobile`)

### ✅ AUTH-01 — Infraestructura de Seguridad (completado)

#### Core de Seguridad

| Archivo | Descripción |
|---|---|
| `.env.example` | Variables de entorno: `SECRET_KEY`, `ALGORITHM="HS256"`, `ACCESS_TOKEN_EXPIRE_MINUTES=60` |
| `app/core/__init__.py` | Inicialización del paquete core |
| `app/core/security.py` | `hash_password()`, `verify_password()` (bcrypt via passlib), `create_access_token()` (JWT via jose.jwt) — 4 tests ✅ |
| `app/schemas/__init__.py` | Inicialización del paquete schemas |
| `app/schemas/auth_user.py` | 11 schemas Pydantic v2: `RoleEnum`, `ProfileBase/Create/Update/Response`, `UserCreate/Update/Response/WithProfileResponse`, `Token`, `TokenData` — 13 tests ✅ |

#### Servicio de Persistencia (TinyDB)

| Archivo | Descripción |
|---|---|
| `app/services/__init__.py` | Inicialización del paquete services |
| `app/services/db_service.py` | Persistencia de User y Profile con TinyDB en `app/services/tinydb_storage.json` |
| `app/services/test_db_service.py` | 24 tests: operaciones CRUD para Profile y User, validación de email duplicado, hash de contraseña |

#### Dependencia de Autenticación (FastAPI)

| Archivo | Descripción |
|---|---|
| `app/api/__init__.py` | Inicialización del paquete api |
| `app/api/deps.py` | Dependencia `get_current_user()` con `OAuth2PasswordBearer` — 9 tests ✅ |

**Flujo de `get_current_user`:**
1. Extrae token del header `Authorization: Bearer <token>` mediante `OAuth2PasswordBearer`
2. Decodifica JWT con `jose.jwt` usando `SECRET_KEY` + `ALGORITHM`
3. Valida expiración (`ExpiredSignatureError` → 401 "El token ha expirado")
4. Extrae `sub` como ID del usuario (debe ser entero numérico)
5. Busca usuario con `get_user_by_id()` — si no existe → 401
6. Verifica `is_active == True` — si está desactivado → 401 "La cuenta está desactivada"
7. Todas las respuestas 401 incluyen header `WWW-Authenticate: Bearer`

**Operaciones disponibles:**
| Función | Descripción |
|---|---|
| `create_user(email, password, role, name, phone, address)` | Registra usuario con password hasheada + perfil opcional. Valida email único. |
| `get_user_by_id(user_id)` | Obtiene usuario + perfil anidado |
| `get_user_by_email(email)` | Obtiene usuario + perfil anidado por email |
| `get_all_users()` | Lista todos los usuarios con sus perfiles |
| `update_user(user_id, email, password, role, is_active)` | Actualiza campos parciales; password se re-hashea |
| `delete_user(user_id)` | Elimina usuario + perfil asociado |
| `create_profile(user_id, name, phone, address)` | Crea perfil asociado a un usuario |
| `get_profile_by_user_id(user_id)` | Obtiene perfil por ID de usuario |
| `update_profile_by_user_id(user_id, updates)` | Actualiza perfil (solo campos presentes) |
| `delete_profile_by_user_id(user_id)` | Elimina perfil |

**Características clave:**
- Contraseña nunca almacenada en texto plano (bcrypt via `app.core.security.hash_password`)
- Tablas separadas `users` y `profiles` en TinyDB (relación 1:1 vía `user_id`)
- Validación de unicidad de email en creación y actualización
- Perfil opcional: solo se crea si se provee `name`
- Eliminación en cascada: `delete_user` también borra el perfil

### ✅ AUTH-02 — Autenticación JWT y Protección de Rutas (completado · rama `Autenticación_yRestricción`)

> Rama: `Autenticación_yRestricción` · commit `07caf97` — "feat(auth): implementar autenticación JWT, restricción de rutas y protección de endpoints de proveedores"

- **App FastAPI central**: `app/main.py` monta routers `/auth`, `/users`, `/profiles`, `/suppliers`; lifespan siembra proveedores; CORS abierto en dev.
- **Login**: `POST /auth/login` (OAuth2 form) valida user/password/is_active → devuelve `{access_token, token_type}`.
- **Protección**: `get_current_user` (OAuth2PasswordBearer) protege 5 rutas de proveedores y las de users/profiles. 401 con header `WWW-Authenticate: Bearer`.
- **Registro público**: `POST /users/` (sin auth) — crea usuario + perfil opcional.
- **Credenciales por defecto**: se siembran usuarios de prueba al arrancar (o en la BD dev existente).
- **79 tests** de backend (AUTH-01 + AUTH-02) pasan ✅.

### ✅ AUTH-03 — Recuperación y Cambio de Contraseña (completado · rama `Restablecimiento_de_Contraseña`)

> Rama: `Restablecimiento_de_Contraseña` · 4 commits pusheados · consumo completo (backend → frontend → tests).

#### Backend (commit `29027fa`)

| Endpoint | Método | Auth | Descripción |
|---|---|---|---|
| `/auth/forgot-password` | POST | ❌ | Email válido → genera token aleatorio (secreto 32), persiste hash en tabla `password_resets`, envía email best-effort (Resend). **Siempre responde 200** (anti-enumeración) |
| `/auth/reset-password` | POST | ❌ | Token → cambia password. Errores 400: token inválido / ya utilizado / expirado |
| `/auth/change-password` | POST | ✅ JWT | Verifica `current_password` → 400 "La contraseña actual no es correcta" |

- **Tabla `password_resets`** en TinyDB: columnas `id`, `user_id`, `token_hash`, `expires_at`, `used_at`, `used`.
- **Expiración**: `expires_at = now + 30 min` (**HARDCODED** — no leído de env; ver nota en pendientes).
- `app/core/email.py`: `send_reset_password_email()` vía Resend API — requiere `EMAIL_SERVICE_API_KEY` (mejor-esfuerzo; sin key no causa error de contrato, siempre 200).
- `.env.example`: variables documentadas `RESET_TOKEN_EXPIRE_MINUTES=30`, `EMAIL_SERVICE_API_KEY`, `EMAIL_FROM`, `FRONTEND_URL`.

#### Frontend (commits `16e948f` + `3782b83`)

| Archivo | Descripción |
|---|---|
| `uis/website/src/app/login/page.tsx` | Login con JWT; guarda token (`setAuthToken`) y redirige a `/`; link "¿Olvidaste tu contraseña?" |
| `uis/website/src/app/forgot-password/page.tsx` | Formulario email → `POST /auth/forgot-password`; success card genérica "Revisa tu correo..." |
| `uis/website/src/app/reset-password/page.tsx` | Lee `?token=` (useSearchParams + Suspense); valida ≥8 + igualdad; 400 → "El enlace de restablecimiento es inválido o ha expirado" |
| `uis/website/src/app/account/change-password/page.tsx` | Formulario autenticado (JWT en header): actual, nueva, confirmar; validación client-side (≥8 + coincidencia), 400 → feedback, 200 → "Tu contraseña ha sido actualizada correctamente." |
| `uis/website/src/lib/auth.ts` | `setAuthToken`/`getAuthToken`/`clearAuthToken`, `isAuthenticated`, `authHeaders()`, evento `nexova:auth-changed` |
| `uis/website/src/lib/api.ts` | `API_BASE_URL` con detección de Codespaces + fallback localhost:8000 |

- **Patrón de sesión**: token guardado en `localStorage` (`nexova_access_token`), evento `nexova:auth-changed` para re-render reactivo (usado con `useSyncExternalStore` en change-password).
- Change-password 401 → limpia token y muestra "Tu sesión ha expirado".

#### Tests (commit `c3b08b6`) — `tests/test_password_reset.py`

Suite pytest con `TestClient` (FastAPI), **6 tests** — 6/6 ✅:

| Test | Cubre |
|---|---|
| `test_forgot_password_always_returns_200` | anti-enumeración (email existente y no) |
| `test_reset_password_success_flow` | login con nueva password 200, anterior 401 |
| `test_reset_password_token_reuse_fails` | token de un solo uso → 400 "utilizado" |
| `test_reset_password_expired_token_fails` | token expirado → 400 "expirado" |
| `test_change_password_validations` | current incorrecta 400, correcta 200, restaura password inicial |
| `test_unauthorized_access` | sin JWT → 401 + `WWW-Authenticate: Bearer` |

- **Aislamiento BD**: monkeypatch de `app.services.db_service._DB_PATH` + `_db_instance=None` a archivo temporal ANTES de importar la app (nunca toca la BD dev).
- **Fixture**: `client = TestClient(app)` SIN context manager (evita lifespan seed de suppliers).
- Ejecución: `python3 -m pytest tests/test_password_reset.py -v`.

**Estado:** ✅ Todo commiteado y pusheado; árbol limpio; sin cambios pendientes al cierre de sesión.

### ✅ Gobernanza de Agentes — AGENTS.md (creado y actualizado)

`AGENTS.md` con:
1. Protocolo de lectura obligatoria de contexto al inicio de cada sesión
2. Flujo Pre-Commit obligatorio (4 pasos secuenciales)
3. Zonas protegidas (secretos, config crítica, CI/CD)
4. Norma operativa general
5. Invocación manual de skills

### ✅ Contexto de Negocio — `context.nexova/` (poblado completamente)

Todos los documentos de contexto de los hitos del curso están presentes:

| Carpeta | Contenido |
|---|---|
| `context.nexova/` (raíz) | Briefing general + Hitos 1, 2, 3, 5 |
| `context.nexova/CONTEXT-nexova.es (6)/telemetry/` | Telemetría |
| `context.nexova/CONTEXT-nexova.es (6)/data-pipeline/` | Data Pipeline |
| `context.nexova/CONTEXT-nexova.es (7)/` | RAG + documentos fuente (service-lines, pricing, SLA, objection-handling) |
| `context.nexova/CONTEXT-nexova.es (8)/memory/` | Memoria de agentes |
| `context.nexova/CONTEXT-nexova.es (8)/harnessing/` | Harness y guardrails |
| `context.nexova/CONTEXT-nexova.es (9)/` | RFP Workflows (con 3 PDFs semilla) |
| `context.nexova/CONTEXT-nexova.es (10)/notification/` | Notificaciones en tiempo real |
| `context.nexova/CONTEXT-nexova.es (10)/communication/` | WebSockets de chat |

### ✅ Skill project-map — NUEVA

| Archivo | Descripción |
|---|---|
| `skills/project-map/SKILL.md` | Mapa completo del proyecto (316 líneas): directorios, puertos, rutas, servicios, URLs |
| `skills/project-map/README.md` | Descripción en inglés |
| `skills/project-map/README.es.md` | Descripción en español |

**Auto-update**: Cada invocación actualiza estado de puertos y URLs de previsualización.

### ✅ Mejoras de diseño con impeccable.style

| Mejora | Descripción |
|---|---|
| `impeccable` CLI instalado (v3.6.0) | Como devDependency en `uis/backoffice/` |
| 0 anti-patterns | Layout-transition corregido en BreakdownTable y SatisfactionIndex |
| DESIGN.md creado | Personalización de reglas de detección |
| `globals.css` mejorado | Sistema de tokens CSS, `.btn` clases, `.wrapper--wide`, `.hide-mobile` |
| color-scheme: dark | Solución para dropdowns con fondo gris claro |
| Select/option styles | Estilos explícitos para dropdowns en formularios |

---

## 2) Tareas en curso / Pendientes

### Pendientes de estabilización técnica

| Tarea | Estado | Prioridad |
|---|---|---|
| Consolidar configuración monorepo (workspaces, lockfile único) | 🔴 Pendiente | Alta |
| Corregir `turbopack.root` en Next configs | 🟡 Sin empezar | Alta |
| Testing de regresión (formulario, API tracker, análisis, proveedores) | 🔴 Pendiente | Alta |
| Migrar `<img>` a `next/image` en website (warning ESLint) | 🟡 Sin empezar | Media |

### Mejoras ofrecidas pero NO implementadas (pendientes de aprobación)

| Mejora | Detalle | Estado |
|---|---|---|
| Leer `RESET_TOKEN_EXPIRE_MINUTES` desde env | `app/api/auth.py` hardcodea 30 min en `forgot-password` (línea ~177). `.env.example` documenta `RESET_TOKEN_EXPIRE_MINUTES=30`. Hacerlo configurable como `ACCESS_TOKEN_EXPIRE_MINUTES` (patrón en `app/core/security.py`). Se podría acompañar con test de expiración ya existente | 🟡 Propuesta — NO aprobada. El usuario cerró sesión: "vejáramos de trabajar por ahora" |

### Hitos del curso NO INICIADOS

| Hito | Contexto | Estado |
|---|---|---|
| **Hito 5** — Gestión de Inventario Backend | `CONTEXT-nexova.es (5).md` | 🟡 En progreso (CRUD proveedores listo; inventario Asset/AssetEntry/AssetExit pendiente) |
| **Hito 6** — Telemetría + Data Pipeline | `CONTEXT-nexova.es (6)/` | ❌ No iniciado |
| **Hito 7** — RAG y Base de Conocimiento | `CONTEXT-nexova.es (7)/` | ❌ No iniciado (documentos fuente listos) |
| **Hito 8** — Memoria y Aseguramiento de Agentes | `CONTEXT-nexova.es (8)/` | ❌ No iniciado |
| **Hito 9** — Flujos de Trabajo Agénticos (RFP) | `CONTEXT-nexova.es (9)/` | ❌ No iniciado (3 PDFs semilla listos) |
| **Sistemas en Tiempo Real** | `CONTEXT-nexova.es (10)/` | ❌ No iniciado |

---

## 3) Validaciones ejecutadas

- **Root**: `npm run typecheck` ✅ OK
- **Website**: `npm run typecheck` ✅ OK, `npm run build` ✅ OK
- **Backoffice**: `npm run typecheck` ✅ OK, `npm run build` ✅ OK
- **Backoffice (impeccable)**: 0 anti-patterns ✅
- **Talent Pipeline Tracker**: build previo ✅ OK
- **Lint**: website y backoffice sin errores bloqueantes ✅
- **Servicios**: FastAPI arranca en puerto 8000 ✅ | Backoffice Next.js en puerto 3000 ✅
- **AUTH-03 pytest**: `python3 -m pytest tests/test_password_reset.py -v` → **6 passed** ✅ (2026-09-03)

---

## 4) Próximos pasos del roadmap

### Corto plazo (estabilización técnica)

1. **Consolidar monorepo**:
   - Definir estrategia de workspaces (npm workspaces)
   - Unificar lockfile (eliminar lockfiles duplicados en uis/)
   - Estandarizar scripts root: `dev`, `build`, `lint`, `test` para todos los paquetes
2. **Corregir configuraciones Next.js**:
   - Fijar `turbopack.root` en `next.config.ts` de website y backoffice
   - Migrar `<img>` a `next/image` en `Hero.tsx`
3. **Testing mínimo de regresión**:
   - Validaciones del formulario de talento
   - Contratos API del tracker
   - Smoke tests de análisis de incidencias y proveedores
4. **Mejoras pendientes en proveedores**:
   - Verificar correcta integración DELETE con frontend
   - Probar filtros combinados (país + categoría)

### Medio plazo (próximos hitos del curso)

1. **Hito 5 — Inventario Backend**: API de inventario con FastAPI/SQLModel, entidades Asset/AssetEntry/AssetExit, stock calculado
2. **Hito 6 — Telemetría**: instrumentación de eventos, almacenamiento, endpoint de reporte
3. **Hito 6 — Data Pipeline**: pipeline semanal de desempeño, tabla `reporting.weekly_office_program_performance`
4. **Hito 7 — RAG**: indexar documentos fuente en Qdrant, endpoint de consulta, interfaz mínima
5. **Hito 8 — Agentes**: memoria conversacional, guardrails anti-inyección, harness de pruebas
6. **Hito 9 — RFP Workflows**: sistema multiagente de procesamiento de RFP con 3 PDFs semilla
7. **Sistemas en Tiempo Real**: notificaciones SSE para tickets RFP + WebSocket para chat de soporte

### Largo plazo (visión AI-ready empresarial)

1. Pipeline de datos unificado para dashboards de dirección y equipos
2. Telemetría y logging centralizados
3. Agentes de IA por función (selección, soporte, RRHH, dirección)
4. Automatización de reportes ejecutivos semanales en tiempo real

---

## 5) Riesgos y dependencias críticas

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Dependencia de API externa (`playground.4geeks.com`) para tracker | Demo puede fallar si la API está caída | Considerar mock local para desarrollo offline |
| Múltiples lockfiles sin orquestador | Deriva técnica entre áreas, builds inconsistentes | Priorizar consolidación de monorepo |
| Sin testing automatizado | Regresiones no detectadas en validaciones, API tracker, incidencias, proveedores | Plan de tests mínimos post-consolidación |
| `uis/website` warning ESLint (`no-img-element`) | No bloquea, pero degrada performance | Migrar a `next/image` en próxima iteración |
| `db.json` en services/api (TinyDB) sin .gitignore | Datos de prueba en el repositorio | Añadir `*.db.json` al .gitignore (ya hecho) |

---

## 6) Documentación de Arquitectura — CREADA

Se ha creado `docs/ARCHITECTURE_PROPOSAL.md` con la propuesta arquitectónica completa del backend:

- **Patrón**: Modular Monolith con Capas (Layered Architecture) para evolucionar a microservicios
- **Framework**: FastAPI v2+ con Pydantic v2 y SQLModel v2
- **Estructura propuesta**: `services/` con `core/`, `domains/*/`, `agents/`, `pipelines/`
- **Comunicación**: REST/JSON versionado (`/api/v1/`)
- **Desacoplamiento**: Frontend (Next.js) ↔ Backend (FastAPI) solo vía HTTP, CORS por entorno
- **Riesgos identificados**: 4 riesgos con acciones preventivas documentadas
- **Próximos pasos**: Refactorizar `services/server.py` → `services/main.py` + `domains/incidents/`

## 7) Estructura actual del monorepo (visión general)

```
/
├── AGENTS.md                         # ✅ Gobernanza de agentes IA
├── .gitignore                        # ✅ Nuevo — excluye node_modules, .next, __pycache__, db.json
├── context.nexova/                   # ✅ Contexto completo de todos los hitos
├── docs/
│   └── ARCHITECTURE_PROPOSAL.md      # ✅ Propuesta arquitectónica backend
├── uis/
│   ├── website/                      # ✅ Hito 1 — Sitio web público (Next.js)
│   ├── backoffice/                   # ✅ Dashboard + Incidencias + Proveedores
│   └── talent-pipeline-tracker/      # ✅ Hito 3 — Tracker de candidatos (SPA)
├── services/
│   ├── server.py                     # ✅ FastAPI — API de incidencias + proveedores (puerto 8000)
│   └── api/                          # ✅ Módulo de proveedores (TinyDB, Pydantic, CRUD)
├── app/
│   ├── core/
│   │   ├── __init__.py               # ✅ AUTH-01 core package
│   │   └── security.py               # ✅ AUTH-01 bcrypt + JWT (4 tests)
│   ├── schemas/
│   │   ├── __init__.py               # ✅ AUTH-01 schemas package
│   │   └── auth_user.py              # ✅ AUTH-01 11 schemas (13 tests)
│   ├── api/
│   │   ├── __init__.py               # ✅ AUTH-01 api package
│   │   └── deps.py                   # ✅ AUTH-01 get_current_user (9 tests)
│   └── services/
│       ├── __init__.py               # ✅ AUTH-01 services package
│       ├── db_service.py             # ✅ AUTH-01 TinyDB persistence (24 tests)
│       └── tinydb_storage.json       # ⏳ Generado automáticamente
├── packages/
│   ├── nexova_analyzer/              # ✅ Analizador de incidencias (Python)
│   └── shared/                       # ✅ Tipos compartidos (TypeScript)
├── src/                              # ✅ Utilidades TypeScript
├── scripts/                          # ✅ CLIs y datasets
├── skills/
│   ├── project-map/                  # ✅ NUEVA — Mapa completo del proyecto
│   └── (code-review, data-analysis, research)
├── agents/                           # ✅ Template + tools
├── memory-bank/                      # ✅ projectbrief, techContext, progress
└── server.py (raíz)                  # ✅ Flask legacy (HTML estáticos, puerto 3001)
│   ├── nexova_analyzer/              # ✅ Paquete Python reutilizable
│   └── shared/                       # ✅ @repo/shared-types
├── src/                              # ✅ Utilidades TypeScript (Hito 2)
├── scripts/
│   ├── analyze.py                    # ✅ CLI de análisis de incidencias
│   └── incidents-nexova.csv          # ✅ Dataset de prueba
├── data/                             # ⬜ Pipelines y evaluación (vacío)
├── agents/                           # ⬜ Patrones de agentes (vacío)
└── workflows/                        # ⬜ Flujos de trabajo (vacío)
```
