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

### Talent Pipeline Tracker — `uis/talent-pipeline-tracker/`

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** estricto
- Dashboard con listado de candidatos, filtros, paginación
- Detalle, edición, eliminación y notas internas
- Creación de candidatos
- **SSE** para actualización en tiempo real
- Dependencia de API externa (`playground.4geeks.com`)

### Backend de Análisis — `services/server.py`

- **FastAPI** con endpoint `POST /api/incidents/analyze` y `GET /api/incidents/results/export`
- CORS habilitado para frontend
- Utiliza el paquete `nexova_analyzer` para toda la lógica de análisis

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
- Cada UI tiene su propio `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`

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
