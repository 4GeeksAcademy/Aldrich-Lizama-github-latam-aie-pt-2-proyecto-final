# Technical Context — Nexova Monorepo

## 1) Stack tecnológico actual y arquitectura del monorepo

## Panorama general

El repositorio sigue una estructura de **monorepo** orientada a hitos de AI Engineering, con separación por dominios:

- `uis/`: interfaces de usuario (website pública, backoffice, talent-pipeline-tracker).
- `services/`: APIs y workers (FastAPI, Flask legacy).
- `data/`: pipelines, datasets y evaluación.
- `packages/`: módulos reutilizables (nexova_analyzer, shared-types).
- `src/`: utilidades TypeScript de lógica de negocio (candidate management).
- `scripts/`: CLIs de análisis y utilidades.
- `skills/`, `agents/`, `workflows/`, `mcps/`: capas orientadas a automatización y agentes.
- `context.nexova/`: documentos de contexto de negocio para todos los hitos.

## Stack implementado hoy (evidencia en código)

### Web pública (Hito 1) — `uis/website/`

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** estricto
- Componentes: `Header`, `Hero`, `Services`, `WhyNexova`, `Contact`, `Footer`, `TalentForm`
- Páginas: `/` (landing), `/talent` (formulario de registro)
- SEO on-page con Schema.org Organization (JSON-LD)
- Validaciones de formulario en cliente con mensajes específicos de negocio
- Soporte **ES/EN** bilingüe

Archivos heredados (HTML vanilla, mantenidos por compatibilidad):
- `index.html` / `index.en.html`
- `application.html` / `application.en.html`
- `validation.js`

### Backoffice — `uis/backoffice/`

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** estricto
- **Tailwind CSS v4 + PostCSS**
- **ESLint 9** + eslint-config-next

#### Dashboard principal (`/`)
- Resumen de operaciones con tarjetas de métricas de negocio
- Enlace a sección de Análisis de Incidencias
- Consume lógica desde `src/dashboardSummary.ts` vía `src/lib/business-summary.ts`

#### Análisis de Incidencias (`/incidents`)
- Subida de CSV con drag & drop
- Visualización de resultados: tarjetas de métricas, tablas de desglose por categoría/estado, índice de satisfacción, alertas de registros inválidos
- Botón de exportación a CSV
- Componentes: `CsvUploader`, `MetricsCards`, `BreakdownTable`, `SatisfactionIndex`, `InvalidRecordsAlert`, `ExportButton`
- Comunicación con backend FastAPI en `services/server.py`

#### Directorio de Proveedores (`/suppliers`) — NUEVO
- Página completa (~960 líneas) en `src/app/suppliers/page.tsx`
- Tipos en `src/app/suppliers/types.ts` (Supplier, CreateSupplier, SupplierFormData)
- API client en `src/app/suppliers/api.ts`
- **Lucide React** para toda la iconografía (Plus, X, CheckCircle, XCircle, AlertTriangle, DollarSign, Trash2, EyeOff, Eye, Search, RefreshCw, Globe, Calendar, Clock, Building2, MapPin, Tag, Filter, Loader2)
- Summary bar con 4 KPI cards (total, activos, suspendidos, tarifa promedio)
- Tabla responsive con acciones horizontales (icon-only)
- Modal de confirmación de eliminación (soft-delete) con animación (`modalIn`)
- Modal de creación/edición de proveedores
- Modal de actualización de tarifa
- Filtros por país y categoría
- Diseño responsive: `.wrapper--wide` (1280px), `.hide-mobile` para columnas en mobile

#### Diseño global del backoffice — mejorado (2026-09)
- **impeccable.style CLI v3.6.0** instalado como devDependency (0 anti-patterns ✅)
- **CSS Design System** en `globals.css` con tokens: `--bg: #0f1b24`, `--card: #142735`, `--text: #ecf2ef`, `--accent: #7ec0a7`, etc.
- Clases base: `.btn`, `.btn--primary`, `.btn--danger`, `.btn--ghost`
- `color-scheme: dark` en `:root` + estilos explícitos para `select`/`option` (corrige dropdowns grises)
- `prefers-reduced-motion` para animaciones accesibles
- `DESIGN.md` con reglas personalizadas para impeccable

### Talent Pipeline Tracker — `uis/talent-pipeline-tracker/`

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** estricto
- Dashboard con listado de candidatos, filtros, paginación
- Detalle, edición, eliminación y notas internas
- Creación de candidatos
- **SSE** para actualización en tiempo real
- Dependencia de API externa (`playground.4geeks.com`)

### Backend de Análisis y Proveedores — `services/server.py`

- **FastAPI** con endpoints `POST /api/incidents/analyze` y `GET /api/incidents/results/export`
- CORS habilitado para frontend (wildcard en desarrollo)
- Utiliza el paquete `nexova_analyzer` para toda la lógica de análisis
- **Incluye router de proveedores** (`services/api/routes/suppliers.py`) montado en `app.include_router()`
- Título: "Nexova API — Incidencias y Proveedores" v1.1.0

### Módulo de Proveedores — `services/api/`

API RESTful para directorio de proveedores con almacenamiento ligero:

| Archivo | Propósito |
|---|---|
| `database.py` | Singleton TinyDB 4.9.0 — `get_suppliers_table()` con carga lazy |
| `models.py` | Modelos Pydantic v2: `SupplierCreate`, `SupplierResponse`, `SupplierRateUpdate`, `SupplierStatusUpdate`. Validators: `field_validator` y `model_validator` |
| `router.py` | APIRouter con prefijo `/api/suppliers`. CRUD completo + soft-delete |
| `routes/suppliers.py` | Router integrado en server.py con soft-delete (`deleted_at` + `status="suspended"`) |
| `seed.py` | 15 proveedores de ejemplo precargados en `db.json` |
| `main.py` | Entrypoint directo para `uvicorn services.api.main:app --reload` |

**Endpoints:**

| Método | Ruta | Función |
|--------|------|---------|
| GET | `/api/suppliers` | Listar con filtros opcionales `?country=`, `?category=` |
| GET | `/api/suppliers/{id}` | Obtener detalle por doc_id numérico |
| POST | `/api/suppliers` | Crear nuevo proveedor (status_code 201) |
| PUT | `/api/suppliers/{id}/rate` | Actualizar `monthly_rate` + `updated_at` |
| PUT | `/api/suppliers/{id}/status` | Activar/suspender (`"active"` / `"suspended"`) |
| DELETE | `/api/suppliers/{id}` | Soft-delete: setea `deleted_at = now_iso()` y `status = "suspended"` |

**Modelo Supplier:**
```python
class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    contacto: str = Field(..., min_length=1, max_length=120)
    country: str  # VALID_COUNTRIES = ["Spain", "USA"]
    categories: list[str]  # min 1, max 3, desde VALID_CATEGORIES
    monthly_rate: float = Field(..., gt=0, le=100_000)
    currency: str  # derivado del país (EUR/USD)
    status: str = "active"  # VALID_STATUSES = ["active", "suspended"]
    deleted_at: str | None = None
```

**TinyDB**: Base de datos JSON ligera, sin servidor. Documentos accesibles vía `.doc_id` (API v4). Persiste en `services/api/db.json`. Seed data se carga al iniciar si la tabla está vacía.

### Paquete reutilizable — `packages/nexova_analyzer/`

Módulo Python con:

| Archivo | Responsabilidad |
|---|---|
| `config.py` | Constantes: campos requeridos, categorías válidas, patrones de validación |
| `validators.py` | Validación individual de campos (ticket_id, agent_id, email, fecha, score) |
| `analyzer.py` | Core de análisis: carga CSV, clasifica filas, computa métricas |
| `reporters.py` | Presentación: reporte en consola y exportación CSV |

Estructura de datos del análisis:
```typescript
interface AnalysisResult {
  filename: string;
  total_records: number;
  valid_count: number;
  invalid_count: number;
  invalid_breakdown: Record<string, number>;
  category_counts: Record<string, number>;    // TECHNICAL, BILLING, ACCESS, HR_QUERY, COMPLAINT
  status_counts: Record<string, number>;       // OPEN, CLOSED, DISCARDED
  score_distribution: Record<string, number>;  // Score 1-5
  scored_closed_count: number;
  total_closed_count: number;
  avg_score: number;
}
```

### CLI de Análisis — `scripts/analyze.py`

- Interfaz de línea de comandos que delega en `nexova_analyzer`
- Flags: `--as-json`, `--export [FILE]`, `--no-interactive`
- Dataset de ejemplo: `scripts/incidents-nexova.csv`

### Skill project-map — `skills/project-map/`

Skill de IA que contiene el mapa completo del proyecto:
- Todos los directorios, puertos, rutas y servicios
- URLs de previsualización dinámicas (`$CODESPACE_NAME-{PORT}.app.github.dev`)
- Auto-update del estado de puertos en cada invocación
- Comandos rápidos para iniciar servicios y builds

Archivos:
- `skills/project-map/SKILL.md` (316 líneas) — mapa completo
- `skills/project-map/README.md` — descripción en inglés
- `skills/project-map/README.es.md` — descripción en español

### Utilidades TypeScript del monorepo — `src/`

| Archivo | Contenido |
|---|---|
| `src/types/models.ts` | Interfaces: `Candidate`, `Vacancy`, `SelectionProcess` |
| `src/utils/collections.ts` | Filtrado y ordenamiento de candidatos |
| `src/utils/search.ts` | Búsqueda lineal y binaria |
| `src/utils/transformations.ts` | Scoring, ranking, agrupaciones, reportes |
| `src/utils/validations.ts` | Validación de candidatos y vacantes |
| `src/demo.ts` | Script demo con datos de ejemplo |
| `src/dashboardSummary.ts` | Métricas de resumen para dashboard |

### Configuración del monorepo

- `package.json` root con scripts `typecheck` y `demo`
- `tsconfig.json` root con strict mode, `noUnusedLocals`/`noUnusedParameters`, target ES2022
- `packages/shared/package.json` con `@repo/shared-types`
- `.gitignore` (nuevo) — excluye `node_modules/`, `.next/`, `__pycache__/`, `*.tsbuildinfo`, `*.db.json`
- `pyproject.toml` (nuevo) — configuración del proyecto Python
- Cada UI tiene su propio `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`
- `server.py` (raíz) — Flask legacy en puerto 3001, sirve HTML estáticos (index.html, application.html, playground.html)

### Servicios en ejecución (puertos activos)

| Puerto | Servicio | URL |
|--------|----------|-----|
| 3000 | Backoffice (Next.js) | `https://$CODESPACE_NAME-3000.app.github.dev` |
| 3001 | Website (Next.js) o Flask (HTML) | `https://$CODESPACE_NAME-3001.app.github.dev` |
| 3002 | Talent Pipeline Tracker (Next.js) | `https://$CODESPACE_NAME-3002.app.github.dev` |
| 8000 | FastAPI Backend (Incidencias + Proveedores) | `https://$CODESPACE_NAME-8000.app.github.dev` |

## 2) Decisiones de diseño técnico y restricciones

## Decisiones observables en implementación

- **Separación explícita** entre:
  - experiencia pública (`uis/website` — marketing/captación),
  - experiencia operativa (`uis/backoffice` — dashboard y análisis),
  - tracker de candidatos (`uis/talent-pipeline-tracker` — SPA independiente).
- **Validación temprana** en frontend para proteger calidad de datos antes de entrar a procesos de selección.
- **Realtime pragmático**: SSE en Next.js con polling al backend externo cada 10 segundos, emitiendo eventos solo con cambios (diff por payload serializado).
- **Tipado fuerte** del dominio (status/stage acotados, tipos de análisis bien definidos).
- **Arquitectura en capas** para el análisis de incidencias:
  - Frontend React → API FastAPI → Paquete reutilizable `nexova_analyzer`
  - Separación clara entre validación, análisis y presentación.
- **Código compartido** vía módulos Python (`packages/nexova_analyzer`) importables desde CLI y servidor web.
- **Paquete de contexto completo**: `context.nexova/` contiene todos los briefings de todos los hitos del curso en un solo lugar.

## Restricciones del contexto de negocio y producto

- La captura del formulario está restringida a candidatos, no a empresas contratantes.
- Validaciones exactas de campos críticos: email, teléfono con código país, experiencia 0-50, URL de LinkedIn, aceptación de política.
- Requerimientos no funcionales explícitos: responsive, accesibilidad, SEO, markup Schema.org.
- Operación multi-región (España/Miami): bilingüismo recomendado (base + segundo idioma).
- Para el análisis de incidencias: formato `NXV-XXXXXX` para tickets, `AGT-XX` para agentes, scores 1-5, categorías cerradas.

## Restricciones técnicas actuales

- **Dependencia de API externa** para talent pipeline tracker (riesgo de latencia/disponibilidad).
- **Sin telemetría centralizada** integrada aún en el monorepo.
- **Workspace root ambiguo** detectado por Next debido a lockfiles múltiples (root + uis), pendiente de consolidación.
- **Múltiples lockfiles** activos (root y cada UI) sin orquestador unificado.
- **Legacy HTML** mantenido junto a las nuevas apps Next.js (index.html, validation.js).

## 3) Convenciones de integración entre componentes

## Convenciones de datos

- Contratos de API definidos con interfaces TypeScript (`RecordOut`, `RecordCreate`, `NoteOut`, `AnalysisResult`, etc.).
- Enumeraciones cerradas para estados de reclutamiento:
  - `status`: `received`, `in_progress`, `selected`, `discarded`
  - `stage`: `pending`, `review`, `personal_interview`, `technical_interview`, `offer_presented`
- Enumeraciones cerradas para análisis de incidencias:
  - `category`: `TECHNICAL`, `BILLING`, `ACCESS`, `HR_QUERY`, `COMPLAINT`
  - `status`: `OPEN`, `CLOSED`, `DISCARDED`
  - `score`: 1-5

## Convenciones de flujo frontend

- **Next.js App Router** con layouts modulares.
- **Client Components** (`"use client"`) para interactividad.
- **Server Components** donde no se necesita estado.
- Variables de entorno: `NEXT_PUBLIC_API_URL` configurable.
- **CORS** habilitado en backend para desarrollo local.

## Convenciones de integración cross-stack

- El backend Python (`services/server.py`) expone endpoints REST que el frontend Next.js consume.
- El paquete `nexova_analyzer` es la única fuente de verdad para la lógica de análisis.
- Los scripts CLI (`scripts/analyze.py`) y el servidor web importan desde el mismo paquete.
- Las utilidades TypeScript (`src/`) se consumen desde el backoffice a través de imports locales.
- El contexto de negocio completo reside en `context.nexova/` como documentación viva.

- UI consume API externa a través de una capa única (lib/api.ts).
- Hooks encapsulan lógica de fetch, paginación, filtros, debounce y refresco.
- SSE actualizado por filtros (search/status/stage) y reconexión con backoff exponencial.

## Convenciones de experiencia y negocio

- Mensajería de error y éxito alineada al copy definido por el stakeholder.
- Señalización visible del desvío para empresas fuera del flujo de candidatos.
- Idioma principal español con soporte complementario en inglés.

## Convenciones de monorepo para evolución AI-ready

- Nuevas capacidades de IA (RAG, scoring, agentes, automatización) deben acoplarse por capas:
  - contratos compartidos en packages/shared,
  - exposición por services/mcps,
  - consumo en uis,
  - evaluación y datasets en data,
  - automatización operativa en workflows/skills/agents.

### Convenciones de seguridad (AUTH-01)

- **Hash de contraseñas**: `passlib.hash.bcrypt` (bcrypt v4.x compatible con passlib 1.7.4).
- **JWT**: `python-jose[cryptography]` con algoritmo HS256.
- **Variables de entorno**: `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` cargadas con `python-dotenv`.
- **Email validation**: `EmailStr` de Pydantic v2 con `email-validator` 2.3.0.
- **Persistencia de usuarios**: TinyDB en `app/services/tinydb_storage.json` con tablas separadas `users` y `profiles`.
- **Contraseñas**: Nunca almacenadas en texto plano; se hashean antes de persistir.
- **Autenticación**: `OAuth2PasswordBearer(tokenUrl="/auth/login")` extrae token del header `Authorization: Bearer <token>`.
- **Dependencia protegida**: `get_current_user(token) -> dict` decodifica JWT, extrae `sub` (user_id), busca en BD y verifica `is_active`.
- **Manejo de errores 401**: Token inválido, expirado, usuario inexistente o desactivado → `HTTPException(401)` con `WWW-Authenticate: Bearer`.

### Entrypoint central — `app/main.py` (AUTH-01 integración)

Se creó `app/main.py` como entrypoint central de la API que integra **todos los routers**:

```python
from app.api.auth import router as auth_router          # /auth
from app.api.users import router as users_router         # /users
from app.api.profiles import router as profiles_router   # /profiles
from services.api.routes.suppliers import router as suppliers_router  # /suppliers

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(profiles_router)
app.include_router(suppliers_router)
```

Uso: `uvicorn app.main:app --reload` o `python3 -m app.main`

**Rutas protegidas con JWT en suppliers (5 rutas):**

Se aplicó `dependencies=[Depends(get_current_user)]` en `services/api/routes/suppliers.py`:

| Ruta | Método | Protegida |
|------|--------|-----------|
| `/suppliers` | GET | ✅ `dependencies=[Depends(get_current_user)]` |
| `/suppliers/{supplier_id}` | GET | ✅ |
| `/suppliers/{supplier_id}/rate` | PATCH | ✅ |
| `/suppliers/{supplier_id}/status` | PATCH | ✅ |
| `/suppliers/{supplier_id}` | DELETE | ✅ |

La dependencia se importa desde `app.api.deps` y todas las respuestas 401 incluyen `WWW-Authenticate: Bearer`.
