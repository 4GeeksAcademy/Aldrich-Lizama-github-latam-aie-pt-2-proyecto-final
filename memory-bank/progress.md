# Progress — Nexova AI Engineering Project

> **Branch activo:** `backend` (creada desde `feature/incidents-analysis`)
> **Último commit:** `7a057e1` — "feat: análisis de incidencias, backoffice mejorado y contexto Nexova"
> **PR activo:** `#1` — feat: análisis de incidencias, backoffice mejorado y contexto Nexova
> **Fecha de actualización:** 2026-08-28

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

### 🆕 Análisis de Incidencias (Soporte) — NUEVO módulo completo

#### Backend Python/FastAPI

| Archivo | Descripción |
|---|---|
| `services/server.py` | API FastAPI con endpoints `/api/incidents/analyze` y `/api/incidents/results/export` |
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
| `uis/backoffice/src/app/incidents/components/BreakdownTable.tsx` | Tabla con barras de progreso |
| `uis/backoffice/src/app/incidents/components/SatisfactionIndex.tsx` | Distribución de scores 1-5 |
| `uis/backoffice/src/app/incidents/components/InvalidRecordsAlert.tsx` | Alertas de registros inválidos |
| `uis/backoffice/src/app/incidents/components/ExportButton.tsx` | Botón de exportación CSV |

#### Dataset de prueba
- `scripts/incidents-nexova.csv` — tickets de soporte Nexova para análisis

### ✅ Gobernanza de Agentes — AGENTS.md (creado)

Se creó `AGENTS.md` con:
1. Protocolo de lectura obligatoria de contexto al inicio de cada sesión
2. Flujo Pre-Commit obligatorio (4 pasos secuenciales)
3. Zonas protegidas (secretos, config crítica, CI/CD)
4. Norma operativa general

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

---

## 2) Tareas en curso / Pendientes

### Pendientes de estabilización técnica

| Tarea | Estado | Prioridad |
|---|---|---|
| Consolidar configuración monorepo (workspaces, lockfile único) | 🔴 Pendiente | Alta |
| Corregir `turbopack.root` en Next configs | 🟡 Sin empezar | Alta |
| Testing de regresión (formulario, API tracker, análisis) | 🔴 Pendiente | Alta |
| Migrar `<img>` a `next/image` en website (warning ESLint) | 🟡 Sin empezar | Media |

### Hitos del curso NO INICIADOS

| Hito | Contexto | Estado |
|---|---|---|
| **Hito 5** — Gestión de Inventario Backend | `CONTEXT-nexova.es (5).md` | ❌ No iniciado |
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
- **Talent Pipeline Tracker**: build previo ✅ OK
- **Lint**: website y backoffice sin errores bloqueantes ✅

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
   - Smoke tests de análisis de incidencias (subida CSV, validaciones, exportación)
4. **Backend análisis**:
   - Verificar despliegue y conectividad CORS entre `services/server.py` y frontend

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
| Sin testing automatizado | Regresiones no detectadas en validaciones, API tracker, incidencias | Plan de tests mínimos post-consolidación |
| `uis/website` warning ESLint (`no-img-element`) | No bloquea, pero degrada performance | Migrar a `next/image` en próxima iteración |
| Hitos 5-10 sin iniciar con contexto ya definido | Avance lento si no se priorizan | Roadmap alineado con `context.nexova/` listo para ejecutar |

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
├── context.nexova/                   # ✅ Contexto completo de todos los hitos
├── docs/
│   └── ARCHITECTURE_PROPOSAL.md      # ✅ Propuesta arquitectónica backend
├── uis/
│   ├── website/                      # ✅ Hito 1 — Sitio web público (Next.js)
│   ├── backoffice/                   # ✅ Dashboard + Análisis de Incidencias
│   └── talent-pipeline-tracker/      # ✅ Hito 3 — Tracker de candidatos (SPA)
├── services/
│   └── server.py                     # ✅ FastAPI — API de análisis de incidencias
├── packages/
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
