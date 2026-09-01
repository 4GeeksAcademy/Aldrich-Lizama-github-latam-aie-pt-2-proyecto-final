# Project Map — Nexova Monorepo

> **Skill**: Mapa completo del proyecto con directorios, puertos, rutas, y URLs de previsualización.
> **Auto-update**: Cada vez que se invoca esta skill, debe actualizar la información con el estado actual de puertos, servicios en ejecución, y contenido de previsualización.

---

## 1. Estructura General del Monorepo

```
/workspaces/Aldrich-Lizama-github-latam-aie-pt-2-proyecto-final/
├── uis/                      # Interfaces de usuario (Next.js)
│   ├── backoffice/           #   Backoffice (port 3000)
│   ├── website/              #   Sitio web público (port 3001)
│   └── talent-pipeline-tracker/ # Pipeline de talento (port 3002)
├── services/                 # Backend APIs
│   ├── server.py             #   FastAPI (port 8000) — incidencias + proveedores
│   └── api/                  #   Módulo de proveedores (TinyDB)
├── server.py                 # Flask legacy (port 3001) — sirve HTML estáticos
├── context.nexova/           # Documentos de contexto de negocio (~20 archivos)
├── memory-bank/              # Memoria del proyecto (projectbrief, techContext, progress)
├── packages/                 # Módulos reutilizables
│   ├── nexova_analyzer/      #   Analizador de incidencias (Python)
│   └── shared/               #   Tipos compartidos (TypeScript)
├── src/                      # Utilidades TypeScript
│   ├── types/models.ts
│   └── utils/ (collections, search, transformations, validations)
├── scripts/                  # CLIs y utilidades
├── agents/                   # Agentes de IA
├── skills/                   # Skills de IA (project-map, code-review, data-analysis, research)
├── workflows/                # Workflows automatizados
├── mcps/                     # MCP servers
├── data/                     # Datos (raw, process, eval, pipelines)
├── docs/                     # Documentación de arquitectura
├── infra/                    # Configuración de infraestructura
├── internal/                 # Documentación interna
├── shared/                   # Recursos compartidos
├── AGENTS.md                 # Reglas de gobernanza para agentes AI
├── package.json              # Root package.json
├── tsconfig.json             # TypeScript config
└── validation.js             # Validaciones
```

---

## 2. Interfaces de Usuario (UIs)

### 2.1 Backoffice — `uis/backoffice/`
- **Framework**: Next.js 16.2.10 + React 19.2.4
- **Puerto**: `3000`
- **Iniciar**: `cd uis/backoffice && npm run dev`
- **Previsualización**: `https://$CODESPACE_NAME-3000.app.github.dev`
- **Rutas**:
  | Ruta | Archivo | Descripción |
  |------|---------|-------------|
  | `/` | `src/app/page.tsx` | Dashboard principal |
  | `/incidents` | `src/app/incidents/page.tsx` | Análisis de Incidencias |
  | `/suppliers` | `src/app/suppliers/page.tsx` | Directorio de Proveedores |

### 2.2 Website — `uis/website/`
- **Framework**: Next.js 16
- **Puerto**: `3001`
- **Iniciar**: `cd uis/website && npm run dev`
- **Previsualización**: `https://$CODESPACE_NAME-3001.app.github.dev`
- **Rutas**:
  | Ruta | Archivo | Descripción |
  |------|---------|-------------|
  | `/` | `src/app/page.tsx` | Página principal |
  | `/talent` | `src/app/talent/page.tsx` | Talent pipeline |

### 2.3 Talent Pipeline Tracker — `uis/talent-pipeline-tracker/`
- **Framework**: Next.js 16
- **Puerto**: `3002`
- **Iniciar**: `cd uis/talent-pipeline-tracker && npm run dev`
- **Previsualización**: `https://$CODESPACE_NAME-3002.app.github.dev`
- **Rutas**:
  | Ruta | Archivo | Descripción |
  |------|---------|-------------|
  | `/` | `src/app/page.tsx` | Talent Pipeline Tracker |

---

## 3. Servicios Backend

### 3.1 FastAPI — `services/server.py`
- **Puerto**: `8000`
- **Iniciar**: `cd /workspaces/Aldrich-Lizama-github-latam-aie-pt-2-proyecto-final && python3 services/server.py`
- **Previsualización**: `https://$CODESPACE_NAME-8000.app.github.dev`
- **Documentación**: `https://$CODESPACE_NAME-8000.app.github.dev/docs`
- **Endpoints**:
  | Método | Ruta | Descripción |
  |--------|------|-------------|
  | GET | `/` | Health check + lista de endpoints |
  | POST | `/api/incidents/analyze` | Subir CSV para análisis de incidencias |
  | GET | `/api/incidents/results/export` | Descargar resultados CSV |
  | GET | `/api/suppliers` | Listar proveedores (filtros: `?country=`, `?category=`) |
  | GET | `/api/suppliers/{id}` | Obtener un proveedor por ID |
  | POST | `/api/suppliers` | Registrar nuevo proveedor |
  | PUT | `/api/suppliers/{id}/rate` | Actualizar tarifa mensual |
  | PUT | `/api/suppliers/{id}/status` | Activar o suspender proveedor |
  | DELETE | `/api/suppliers/{id}` | Eliminar (soft-delete) proveedor |

### 3.2 Flask Legacy — `server.py` (raíz)
- **Puerto**: `3001`
- **Iniciar**: `cd /workspaces/Aldrich-Lizama-github-latam-aie-pt-2-proyecto-final && python3 server.py`
- **Previsualización**: `https://$CODESPACE_NAME-3001.app.github.dev`
- **Sirve**: Archivos HTML estáticos desde la raíz del proyecto
- **Archivos servidos**:
  | Archivo | Descripción |
  |---------|-------------|
  | `index.html` | Página principal (HTML estático) |
  | `index.en.html` | Versión en inglés |
  | `application.html` | Aplicación demo |
  | `application.en.html` | Aplicación demo (inglés) |
  | `playground.html` | Playground de pruebas |

---

## 4. Base de Datos

- **Motor**: TinyDB 4.9.0 (JSON-based, sin servidor)
- **Archivo**: `services/api/db.json` (se crea automáticamente al iniciar)
- **Singleton**: `services/api/database.py` — `get_suppliers_table()`
- **Acceso**: Documentos con `.doc_id` (API de TinyDB v4)
- **Seed data**: 15 proveedores de ejemplo (`services/api/seed.py`)

---

## 5. Módulos Compartidos

### 5.1 Python — `packages/nexova_analyzer/`
| Archivo | Propósito |
|---------|-----------|
| `__init__.py` | Exporta `analyze_rows`, `export_csv_string`, `format_report_text` |
| `analyzer.py` | Lógica de análisis de incidencias |
| `config.py` | Configuración (categorías, pesos, umbrales) |
| `reporters.py` | Generación de reportes |
| `validators.py` | Validación de datos de entrada |

### 5.2 TypeScript — `packages/shared/`
| Archivo | Propósito |
|---------|-----------|
| `types/index.ts` | Tipos compartidos entre UIs |
| `package.json` | Package del paquete compartido |

### 5.3 TypeScript — `src/`
| Archivo | Propósito |
|---------|-----------|
| `src/types/models.ts` | Modelos de datos |
| `src/utils/collections.ts` | Utilidades de colecciones |
| `src/utils/search.ts` | Utilidades de búsqueda |
| `src/utils/transformations.ts` | Transformaciones de datos |
| `src/utils/validations.ts` | Validaciones |
| `src/dashboardSummary.ts` | Lógica de resumen de dashboard |
| `src/demo.ts` | Demo / pruebas |

---

## 6. Contexto de Negocio — `context.nexova/`

```
context.nexova/
├── CONTEXT-nexova-briefing.es (1).md        # Briefing general
├── CONTEXT-nexova.es (1).md                 # Contexto principal
├── CONTEXT-nexova.es (2).md                 # Contexto adicional
├── CONTEXT-nexova.es (3).md                 # Contexto adicional
├── CONTEXT-nexova.es (5).md                 # Contexto adicional
├── CONTEXT-nexova.es (10)/
│   ├── communication/                       # Estrategia de comunicación
│   └── notification/                        # Sistema de notificaciones
├── CONTEXT-nexova.es (6)/
│   ├── data-pipeline/                       # Pipeline de datos
│   └── telemetry/                           # Telemetría
├── CONTEXT-nexova.es (7)/
│   ├── CONTEXT-nexova.es.md                 # Contexto de reclutamiento
│   ├── nexova-hiring-process-sla.es.md      # SLA del proceso de contratación
│   ├── nexova-objection-handling.es.md      # Manejo de objeciones
│   ├── nexova-pricing-model.es.md           # Modelo de precios
│   └── nexova-service-lines.es.md           # Líneas de servicio
├── CONTEXT-nexova.es (8)/
│   ├── harnessing/                          # Aprovechamiento de datos
│   └── memory/                              # Memoria del sistema
└── CONTEXT-nexova.es (9)/
    ├── CONTEXT-nexova.es.md                 # Contexto de RFP
    └── rfp-requests/                        # Solicitudes RFP (3 PDFs)
```

---

## 7. Memory Bank

| Archivo | Propósito |
|---------|-----------|
| `memory-bank/projectbrief.md` | Resumen del proyecto, empresa, problema |
| `memory-bank/techContext.md` | Stack tecnológico, arquitectura, decisiones |
| `memory-bank/progress.md` | Estado de avance, tareas completadas, pendientes |

---

## 8. Skills del Sistema

| Skill | Ruta | Propósito |
|-------|------|-----------|
| **project-map** | `skills/project-map/` | ✅ **Esta skill** — Mapa del proyecto |
| code-review | `skills/code-review/` | Revisión de código estandarizada |
| data-analysis | `skills/data-analysis/` | Análisis de datos (CSV, métricas) |
| research | `skills/research/` | Investigación de mercado / tecnología |

---

## 9. Agentes

| Ruta | Propósito |
|------|-----------|
| `agents/_template/` | Template para crear nuevos agentes |
| `agents/tools/` | Herramientas para agentes |

---

## 10. Scripts

| Archivo | Propósito |
|---------|-----------|
| `scripts/analyze.py` | CLI de análisis de incidencias |
| `scripts/incidents-nexova.csv` | Dataset de ejemplo |
| `scripts/CONTEXT-nexova.es.md` | Contexto adicional |

---

## 11. Estado de Puertos (en vivo)

> **Auto-update**: Verificar con `ss -tlnp | grep -E ':(3000|3001|3002|8000)'`

| Puerto | Servicio | Estado |
|--------|----------|--------|
| `3000` | Backoffice (Next.js) | ✅ / ❌ |
| `3001` | Website (Next.js) / Flask (HTML) | ✅ / ❌ |
| `3002` | Talent Pipeline Tracker (Next.js) | ✅ / ❌ |
| `8000` | FastAPI Backend | ✅ / ❌ |

---

## 12. Comandos Rápidos

### Iniciar servicios

```bash
# Backoffice (port 3000)
cd uis/backoffice && npm run dev

# Website (port 3001)
cd uis/website && npm run dev

# Talent Pipeline (port 3002)
cd uis/talent-pipeline-tracker && npm run dev

# FastAPI Backend (port 8000)
python3 services/server.py

# Flask Legacy (port 3001) — HTML estáticos
python3 server.py
```

### Build y verificación

```bash
# Backoffice — typecheck + build
cd uis/backoffice && npm run typecheck && npm run build

# Website — typecheck + build
cd uis/website && npm run typecheck && npm run build

# Backoffice — lint
cd uis/backoffice && npm run lint

# Backoffice — impeccable
cd uis/backoffice && npx impeccable
```

### URLs de previsualización (dinámicas)

```
Backoffice:  https://$CODESPACE_NAME-3000.app.github.dev
Website:     https://$CODESPACE_NAME-3001.app.github.dev
Talent:      https://$CODESPACE_NAME-3002.app.github.dev
FastAPI:     https://$CODESPACE_NAME-8000.app.github.dev
FastAPI Docs: https://$CODESPACE_NAME-8000.app.github.dev/docs
Flask HTML:  https://$CODESPACE_NAME-3001.app.github.dev
```

---

## 13. Reglas de Gobernanza (AGENTS.md)

> **Archivo**: `AGENTS.md` en la raíz del proyecto

- **Lectura obligatoria**: Todo agente debe leer `context.nexova/` (recursivo) y `memory-bank/` antes de proponer cambios.
- **Pre-commit flow**: `tsc --noEmit` → `lint` → tests → update `progress.md`
- **Archivos protegidos**: `AGENTS.md`, `memory-bank/`, `context.nexova/`, `skills/`
- **Commitizen**: Usar `git commit` con mensajes convencionales (no `--no-verify`)

---

## 14. Auto-update de esta Skill

Cada vez que se invoque esta skill, se debe:

1. **Verificar puertos activos**: Ejecutar `ss -tlnp | grep -E ':(3000|3001|3002|8000)'` y actualizar la sección 11.
2. **Verificar servicios en ejecución**: Comprobar que los procesos de Next.js, FastAPI y Flask están corriendo.
3. **Actualizar URLs de previsualización**: Reemplazar `$CODESPACE_NAME` con el valor real de la variable de entorno.
4. **Verificar archivos clave**: Confirmar que los archivos HTML, páginas, y endpoints listados siguen existiendo.
5. **Actualizar sección de contexto**: Si se agregaron/quitaron archivos en `context.nexova/` o `memory-bank/`, reflejar los cambios.

---

*Última actualización: $(date +"%Y-%m-%d %H:%M")*
*Codespace: $CODESPACE_NAME*