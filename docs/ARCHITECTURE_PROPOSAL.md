# Propuesta Arquitectónica Backend — Nexova Solutions

> **Autor:** Lead Software Architect / Senior Backend Engineer
> **Fecha:** 2026-08-28
> **Versión:** 1.0
> **Rama objetivo:** `backend`
> **Documentos relacionados:** `memory-bank/*`, `context.nexova/*`, `services/server.py`, `packages/nexova_analyzer/`

---

## 1. Introducción y Visión

### 1.1 Visión del Backend para Nexova

Nexova Solutions se encuentra en una encrucijada tecnológica. Con 120 empleados, tres líneas de negocio (headhunting, outsourcing de soporte, formación corporativa) y operaciones repartidas entre Valencia y Miami, la empresa opera hoy con un mosaico de herramientas desconectadas: hojas de cálculo, correos electrónicos, un ATS legacy, HubSpot infrautilizado y un helpdesk sin telemetría.

La visión del backend que proponemos es la de una **plataforma de servicios modular, API-first, preparada para IA (AI-ready)** , donde cada dominio de negocio — inventario, incidencias, candidatos, formación, ventas, RRHH — sea un módulo independiente con su propia lógica, sus propios datos y sus propios contratos API, pero todos conviviendo bajo un mismo monorraíl (monorepo) que garantice consistencia, gobernanza y velocidad de entrega.

El backend no es un fin en sí mismo: es el **sistema nervioso** que conecta a los agentes de IA, los dashboards en tiempo real, los pipelines de telemetría y las interfaces de usuario que ya estamos construyendo en `uis/`.

### 1.2 Por qué necesitamos rigor arquitectónico ahora

El repositorio actual refleja el esfuerzo correcto de un equipo que ha estado entregando valor por hitos: un analizador de incidencias en FastAPI funcionando en `services/server.py`, un paquete reutilizable en `packages/nexova_analyzer/`, y tres frontends en Next.js. Sin embargo, este crecimiento orgánico presenta síntomas que, de no corregirse, se convertirán en deuda técnica estructural:

- **Un único archivo `server.py`** que concentra el servidor, los endpoints, la lógica CORS y la configuración. Al añadir el Hito 5 (inventario), Hito 6 (telemetría) y Hito 9 (RFP workflows), este archivo se volverá inmantenible.
- **Lógica de negocio entremezclada** con la capa de transporte HTTP. El día que necesitemos que un agente de IA invoque la misma lógica que expone una ruta, no podremos reutilizarla sin acoplamiento.
- **Ausencia de separación por dominio**: hoy todo vive en la raíz de `services/`. Mañana, con 5 dominios activos, la navegación será caótica.

Esta propuesta establece las bases para que los próximos hitos se construyan sobre una arquitectura sólida, no sobre parches.

---

## 2. Justificación del Patrón Arquitectónico

### 2.1 Patrón elegido: Modular Monolith con Capas (Layered Architecture)

Proponemos una **Arquitectura Modular en Capas** que evolucione de forma controlada hacia microservicios solo cuando el volumen de tráfico o la necesidad de escalamiento independiente lo justifique.

```
┌─────────────────────────────────────────────────────────────┐
│                     CAPA DE PRESENTACIÓN                      │
│  (uis/website, uis/backoffice, uis/talent-pipeline-tracker)  │
├─────────────────────────────────────────────────────────────┤
│                  CAPA DE API / TRANSPORTE                     │
│  (FastAPI routers → endpoints REST)                          │
├─────────────────────────────────────────────────────────────┤
│                  CAPA DE APLICACIÓN / SERVICIOS               │
│  (Use cases, orquestación, lógica de negocio pura)           │
├─────────────────────────────────────────────────────────────┤
│                  CAPA DE DOMINIO / ENTIDADES                  │
│  (Modelos SQLModel, reglas de negocio, validaciones)         │
├─────────────────────────────────────────────────────────────┤
│                  CAPA DE INFRAESTRUCTURA / DATOS              │
│  (Base de datos, cache, sistemas externos, MCP servers)     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Argumentación basada en el negocio de Nexova

Este patrón **no es una preferencia genérica**. Está justificado por las siguientes realidades del negocio:

| Característica de Nexova | Implicación arquitectónica |
|---|---|
| **5 áreas de negocio distintas** (Selección, Soporte, Ventas, RRHH, Formación) | Cada área debe ser un **módulo independiente** con su propio conjunto de rutas, schemas y servicios. Un monolito plano mezclaría responsabilidades. |
| **Roadmap de hitos acelerado** (Hitos 5–10 en semanas, no meses) | La modularidad permite que diferentes miembros del equipo trabajen en paralelo sobre dominios distintos sin conflictos de merge. |
| **IA transversal** (agentes, RAG, scoring, pipelines) | La lógica de IA debe vivir en la **capa de aplicación/servicios**, no acoplada a las rutas HTTP. Un agente necesita invocar `calculate_candidate_score()` sin pasar por una petición HTTP. |
| **Operación multi-oficina** (Valencia/Miami, EUR/USD) | La capa de dominio debe modelar moneda y oficina como ciudadanos de primera clase desde el diseño, no como parches posteriores. |
| **Evolución previsible a microservicios** (telemetría independiente, agentes como servicios) | El Modular Monolith permite extraer dominios a servicios independientes sin reescribir la lógica de negocio — solo moviendo la capa de transporte. |

### 2.3 Por qué NO otros patrones

| Patrón | Razón de descarte |
|---|---|
| **Monolito plano** (un solo directorio, un solo archivo) | Ya estamos experimentando sus límites con `server.py`. Inviable para 5+ dominios. |
| **Microservicios completos desde el inicio** | Sobrecarga innecesaria de infraestructura (orquestación, service mesh, comunicación asíncrona) cuando el equipo es pequeño y los hitos son semanales. |
| **Arquitectura hexagonal pura (Ports & Adapters)** | Excelente para sistemas críticos, pero introduce una indirección que ralentiza la entrega inicial. Podemos adoptarla progresivamente en dominios específicos (pagos, SLAs). |

---

## 3. Estructura de Carpetas y Módulos Propuesta

### 3.1 Árbol completo propuesto para `services/`

```
services/
├── pyproject.toml              # Dependencias unificadas del backend Python
├── .env.example                # Variables de entorno de referencia
├── alembic/                    # Migraciones de base de datos (futuro)
│   └── versions/
│
├── core/                       # Configuración compartida del servidor
│   ├── __init__.py
│   ├── config.py               # pydantic-settings: Settings(BaseSettings)
│   ├── database.py             # Engine, SessionLocal, get_db dependency
│   ├── security.py             # Auth, CORS, rate limiting (futuro)
│   └── dependencies.py         # Depends() reutilizables globales
│
├── domains/                    # ← Módulos de negocio (los dominios)
│   │
│   ├── incidents/              # Análisis de incidencias (existente)
│   │   ├── __init__.py
│   │   ├── router.py           # APIRouter(prefix="/api/v1/incidents")
│   │   ├── schemas.py          # Pydantic request/response
│   │   ├── service.py          # Lógica de análisis (use cases)
│   │   └── utils.py            # Validaciones específicas del dominio
│   │
│   ├── inventory/              # Hito 5 — Gestión de inventario
│   │   ├── __init__.py
│   │   ├── models.py           # SQLModel: Asset, AssetEntry, AssetExit
│   │   ├── schemas.py          # Pydantic: AssetCreate, AssetResponse, etc.
│   │   ├── router.py           # APIRouter(prefix="/api/v1/inventory")
│   │   └── service.py          # Stock calculation, business rules
│   │
│   ├── support/                # Soporte al cliente (tickets, SLAs)
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── router.py           # APIRouter(prefix="/api/v1/support")
│   │   └── service.py
│   │
│   ├── talent/                 # Candidatos y procesos de selección
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── router.py           # APIRouter(prefix="/api/v1/talent")
│   │   └── service.py
│   │
│   ├── training/               # Formación corporativa (Hito 7+)
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── router.py
│   │   └── service.py
│   │
│   └── rfp/                    # Flujo de RFP (Hito 9)
│       ├── __init__.py
│       ├── models.py
│       ├── schemas.py
│       ├── router.py
│       └── service.py
│
├── agents/                     # Lógica de agentes de IA (futuro)
│   ├── __init__.py
│   ├── base.py                 # Clase base Agent
│   ├── first_line_support.py   # Agente de soporte de primera línea
│   └── rfp_orchestrator.py     # Orquestador multi-agente de RFP
│
├── pipelines/                  # Data pipelines (Hito 6)
│   ├── __init__.py
│   └── weekly_performance.py   # Pipeline semanal de desempeño
│
├── main.py                     # FastAPI app factory, include_routers
│
└── routers/                    # (Opcional) Router base o health
    └── __init__.py
```

### 3.2 Justificación de la estructura

**`core/`** — Todo servidor FastAPI necesita configuración, base de datos y dependencias compartidas. Centralizarlo aquí evita que cada módulo defina su propia conexión a DB o su propia lectura de `.env`.

**`domains/`** — Es el corazón del sistema. Cada subcarpeta es un **dominio de negocio** independiente con su propio `router.py`, `schemas.py` y `service.py`. La regla es simple:
- `router.py` solo contiene decoradores de ruta y delega en `service.py`.
- `service.py` contiene la lógica de negocio pura, invocable desde un router o desde un agente de IA.
- `schemas.py` define los contratos Pydantic de entrada/salida, **independientes** de los modelos de base de datos (SQLModel).
- `models.py` solo existe si el dominio requiere persistencia propia.

**`agents/`** — Separado de `domains/` porque los agentes **orquestan** múltiples dominios. Un agente de RFP, por ejemplo, llama a `training.service`, `inventory.service` y `talent.service`.

**`pipelines/`** — Separado porque los pipelines de datos son procesos batch o scheduled, no endpoints REST.

### 3.3 Alineación con FastAPI Standards

| Práctica estándar de FastAPI | Cómo se refleja en la propuesta |
|---|---|
| `APIRouter` por módulo de dominio | Cada `domains/*/router.py` define su propio `APIRouter(prefix="...", tags=["..."])` |
| Schemas Pydantic separados de ORM models | `schemas.py` ≠ `models.py`. Los schemas de request/response se definen con Pydantic v2; los modelos de BD con SQLModel v2 |
| Inyección de dependencias con `Depends` | `core/dependencies.py` expone `get_db`, `get_current_user`, etc. |
| `pydantic-settings` para configuración | `core/config.py` con `class Settings(BaseSettings)` para cargar desde `.env` |
| `app.include_router()` en `main.py` | `main.py` importa e incluye cada router con su prefijo y tags |
| `alembic` para migraciones | `alembic/` preparado para cuando introduzcamos SQLModel + PostgreSQL |

---

## 4. Organización de Routers y Endpoints por Dominios

### 4.1 Criterio de agrupación

Cada dominio se registra en `main.py` mediante `app.include_router()`. El prefijo y las tags determinan cómo aparece en la documentación OpenAPI/Swagger:

```python
# services/main.py — Estructura conceptual (no sintaxis definitiva)

from fastapi import FastAPI
from domains.incidents.router import router as incidents_router
from domains.inventory.router import router as inventory_router
from domains.support.router import router as support_router
from domains.talent.router import router as talent_router
from domains.training.router import router as training_router
from domains.rfp.router import router as rfp_router

app = FastAPI(title="Nexova API", version="1.0.0")

# Módulos de negocio
app.include_router(incidents_router)   # prefix="/api/v1/incidents", tags=["Incidents"]
app.include_router(inventory_router)   # prefix="/api/v1/inventory",  tags=["Inventory"]
app.include_router(support_router)     # prefix="/api/v1/support",   tags=["Support"]
app.include_router(talent_router)      # prefix="/api/v1/talent",    tags=["Talent"]
app.include_router(training_router)    # prefix="/api/v1/training",  tags=["Training"]
app.include_router(rfp_router)         # prefix="/api/v1/rfp",       tags=["RFP"]
```

**Beneficios de este enfoque:**
- **OpenAPI/Swagger generado automáticamente** con secciones por dominio gracias a los `tags`.
- **Versionamiento explícito** (`/api/v1/`) que permite coexistir versiones futuras (`/api/v2/`).
- **Cada router es autónomo**: se puede probar de forma aislada, documentar independientemente y migrar a un microservicio separado sin cambiar la lógica interna.

### 4.2 Mapa de rutas previsto

| Grupo | Prefijo | Endpoints esperados |
|---|---|---|
| **Incidents** | `/api/v1/incidents` | `POST /analyze` — subir CSV y analizar; `GET /results/export` — descargar CSV |
| **Inventory** | `/api/v1/inventory` | `GET /products` — listar activos con stock; `POST /products` — crear activo; `GET /products/{id}` — detalle; `POST /orders/inbound` — entrada; `POST /orders/outbound` — salida; `GET /orders` — historial |
| **Support** | `/api/v1/support` | `GET /tickets` — listar tickets; `POST /tickets` — crear; `GET /tickets/{id}` — detalle; `PATCH /tickets/{id}/status` — actualizar estado; `POST /tickets/analyze` — análisis CSV de incidencias |
| **Talent** | `/api/v1/talent` | `GET /candidates` — listar candidatos; `POST /candidates` — registrar; `GET /candidates/{id}` — detalle; `POST /candidates/{id}/score` — calcular score contra vacante; `GET /vacancies` — listar vacantes |
| **Training** | `/api/v1/training` | `GET /programs` — catálogo; `POST /programs` — crear; `GET /programs/{id}` — detalle; `POST /programs/{id}/enroll` — inscribir; `GET /enrollments` — listar inscripciones |
| **RFP** | `/api/v1/rfp` | `POST /tickets` — subir RFP; `GET /tickets/{id}` — estado del ticket; `GET /tickets` — listar tickets; `GET /tickets/{id}/sections` — secciones por departamento |

### 4.3 Reglas de diseño interno de cada router

Cada `router.py` sigue una estructura predecible:

1. **Instancia** `router = APIRouter(prefix="/api/v1/<dominio>", tags=["<Dominio>"])`.
2. **Endpoints** definidos con decoradores `@router.get`, `@router.post`, etc.
3. **Inyección de dependencias** vía `Depends()` para `db_session`, `current_user`, etc.
4. **Schemas Pydantic** para validar request y serializar response.
5. **Delegación** total al `service.py` — nunca lógica de negocio inline en el router.

```
Ejemplo de flujo limpio:

  Petición HTTP → Router (valida input con Pydantic) → Service (lógica de negocio) → Model (BD) → Response
```

---

## 5. Investigación sobre Estructura Estándar de FastAPI

### 5.1 Convenciones de la industria

FastAPI, al ser un framework relativamente joven pero con una comunidad muy activa, ha consolidado las siguientes convenciones que adoptamos en esta propuesta:

| Convención | Por qué es importante | Cómo la implementamos |
|---|---|---|
| **Schemas Pydantic separados de modelos ORM** | Evita exponer campos internos de la BD (ej. hashed passwords, IDs técnicos). Permite versionar contracts API independientemente del schema de BD. | Cada dominio tiene `schemas.py` (Pydantic v2) y `models.py` (SQLModel). Los schemas de request y response se definen con `model_config` para `from_attributes=True`. |
| **`Depends()` para inyección de dependencias** | Permite testear cada endpoint inyectando dependencias mock. Desacopla la lógica de obtención de recursos (DB, auth, config). | `core/dependencies.py` expone `get_db`, `get_settings`, `get_current_user`. Cada router declara `db: Session = Depends(get_db)`. |
| **`APIRouter` por módulo** | Cada módulo es autónomo, testeable y portable. Facilita la navegación y evita conflictos de merge. | Cada `domains/*/router.py` define su propio `APIRouter`. `main.py` los importa y registra. |
| **`pydantic-settings` para configuración** | Tipado estricto de variables de entorno. Validación en startup. Compatible con `.env` y secretos. | `core/config.py` con `class Settings(BaseSettings)`. `settings = Settings()` es singleton y se inyecta via `Depends`. |
| **Alembic para migraciones** | Trazabilidad de cambios en el schema de BD. Rollback controlado. | `alembic/` preparado para cuando adoptemos PostgreSQL vía SQLModel/SQLAlchemy. |
| **Validación en los bordes (Boundary Validation)** | Los datos se validan al entrar (Pydantic en el router) y al salir (Pydantic en la respuesta). La lógica de negocio trabaja con datos ya validados. | Schemas con `Field(..., pattern=...)`, `field_validator`, `model_validator`. El `service.py` recibe datos tipados y válidos. |

### 5.2 Estructura de archivo `config.py` con pydantic-settings

```python
# services/core/config.py — Estructura conceptual

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App
    app_name: str = "Nexova API"
    debug: bool = False

    # Database
    database_url: str = "sqlite:///./nexova.db"  # → postgresql://... en producción

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:4173"]

    # Nexova-specific
    default_currency: str = "EUR"  # Oficina Valencia
    miami_currency: str = "USD"    # Oficina Miami

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}
```

### 5.3 Cómo estas convenciones evitan redundancias

- **No repetir lógica de validación**: Pydantic valida una vez en el borde. El service recibe datos limpios.
- **No repetir configuración**: `Settings` singleton, accesible desde cualquier módulo vía `Depends`.
- **No repetir definiciones de DB**: SQLModel unifica el modelo de datos con el schema de BD, pero los schemas de API son independientes.
- **No repetir estructura de routers**: Cada dominio sigue la misma plantilla → predecible, familiar, mantenible.

---

## 6. Desacoplamiento Frontend/Backend y Arquitectura de Sistemas Separados

### 6.1 Coexistencia en el monorepo

El monorepo de Nexova alberga tanto los frontends (Next.js en `uis/`) como el backend (FastAPI en `services/`). Esto no significa que estén acoplados — al contrario, operan como **sistemas independientes** que se comunican exclusivamente vía HTTP/REST.

```
Monorepo Nexova
│
├── uis/                         ← Frontends (Next.js, puerto 3000/4173)
│   ├── website/                 ← Público, marketing
│   ├── backoffice/              ← Operaciones internas
│   └── talent-pipeline-tracker/ ← SPA de seguimiento
│
├── services/                    ← Backend (FastAPI, puerto 8000)
│   ├── core/
│   ├── domains/
│   ├── agents/
│   ├── pipelines/
│   └── main.py
│
└── packages/                    ← Código compartido (no depende de HTTP)
    ├── nexova_analyzer/         ← Lógica de análisis (Python)
    └── shared/                  ← Tipos TypeScript (@repo/shared-types)
```

**La regla de oro**: el frontend desconoce la implementación interna del backend. Solo conoce los contratos API (endpoints + JSON schemas). El backend desconoce la existencia de React, Next.js o Tailwind. Solo produce JSON.

### 6.2 Comunicación REST / API Contract

| Aspecto | Estándar |
|---|---|
| **Protocolo** | HTTP/1.1 → HTTP/2 |
| **Formato** | JSON (application/json) |
| **Convención de rutas** | `/api/v1/{domain}/{resource}` |
| **Métodos** | GET (lectura), POST (creación), PUT/PATCH (actualización), DELETE (eliminación) |
| **Errores** | Objeto JSON con `{"detail": "mensaje", "code": "ERROR_CODE"}` |
| **Paginación** | `?skip=0&limit=100` con respuesta `{"items": [...], "total": N}` |
| **Versionado** | `v1` en la ruta; `v2` coexistirá cuando sea necesario |

**Ejemplo de contrato típico:**

```
GET /api/v1/inventory/products?office=valencia&skip=0&limit=20

Response 200:
{
  "items": [
    {
      "id": 1,
      "name": "Portátil 14\" Business",
      "sku": "NXV-IT-001",
      "category": "hardware",
      "office": "valencia",
      "current_stock": 12
    }
  ],
  "total": 1
}
```

### 6.3 Gestión de CORS

Dado que los frontends se ejecutan en puertos distintos (3000, 4173) y el backend en el 8000, es obligatorio configurar CORS correctamente:

```python
# services/core/security.py — Estructura conceptual

from fastapi.middleware.cors import CORSMiddleware

def configure_cors(app, origins: list[str]):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,              # Controlado por entorno
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
```

**Política por entorno:**

| Entorno | Orígenes permitidos |
|---|---|
| **Desarrollo local** | `http://localhost:3000`, `http://localhost:4173`, `http://127.0.0.1:*` |
| **Preview / Codespaces** | URL dinámica del entorno (`.app.github.dev`) |
| **Producción** | Dominios corporativos específicos (`https://nexova.com`, `https://admin.nexova.com`) |

> **⚠️ Crítico**: No usar `allow_origins=["*"]` en producción. Esto expone la API a cualquier sitio web y anula la protección CORS.

### 6.4 Variables de Entorno

| Variable | Dónde se usa | Propósito |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Frontend (Next.js `.env.local`) | URL base del backend que el navegador usará para fetch() |
| `DATABASE_URL` | Backend (`.env`) | Conexión a base de datos (SQLite → PostgreSQL) |
| `CORS_ORIGINS` | Backend (`.env`) | Lista de orígenes permitidos separados por coma |
| `DEBUG` | Backend (`.env`) | Modo debug (True para desarrollo) |
| `SECRET_KEY` | Backend (`.env`) | Clave para JWT/sesiones (futuro) |

**Regla fundamental**: el frontend nunca debe tener acceso a secretos del backend. `NEXT_PUBLIC_*` en Next.js se expone al bundle del navegador — solo usar para URL públicas.

---

## 7. Riesgos Identificados y Puntos de Atención (Trade-offs & Governance)

### 7.1 Riesgo 1: Acoplamiento de lógica de IA dentro de las rutas HTTP

**Problema**: Si se escribe lógica de agentes, scoring o RAG directamente dentro de los decoradores de ruta (`@router.post(...) async def analyze: ...`), esa lógica queda atrapada en el contexto HTTP. Un agente de IA que necesite puntuar un candidato no podrá reutilizar esa función sin hacer una petición HTTP a sí mismo (looping anti-patrón).

**Impacto en el negocio**: Los próximos hitos (RAG, agentes con memoria, orquestación multi-agente de RFP) requieren que la lógica de IA sea invocable tanto desde HTTP como desde otros agentes y desde pipelines batch.

**Acción preventiva**:
- La **regla de oro** debe ser: `router.py` solo parsea request y serializa response. Toda la lógica de negocio vive en `service.py`.
- Los agentes de IA (`agents/`) importan `service.py` directamente, no llaman a los routers.
- Ningún `service.py` debe tener imports de FastAPI (`from fastapi import ...`).

### 7.2 Riesgo 2: Inconsistencias en CORS / Autenticación por crecimiento desordenado

**Problema**: Si cada nuevo dominio configura su propio CORS, su propio middleware de autenticación o sus propias políticas de seguridad de forma independiente, el sistema se volverá inconsistente. Un endpoint podría requerir autenticación y otro no, o peor aún, configuraciones de CORS contradictorias podrían dejar partes de la API inaccesibles.

**Impacto en el negocio**: El backoffice y el talent pipeline tracker dependen de la API. Si CORS falla en producción, los operadores de Nexova no podrán gestionar candidatos, incidencias o inventario. La confianza en la plataforma se erosiona rápidamente.

**Acción preventiva**:
- **Centralizar en `core/`**: `CORS`, `security`, `dependencies` se configuran una vez en `core/` y se aplican globalmente en `main.py`.
- Los routers no pueden sobrescribir la configuración global de CORS.
- El middleware de autenticación (cuando exista) se aplica a nivel de `app` o por router explícitamente, nunca de forma implícita.

### 7.3 Riesgo 3: Mezclar Pydantic Schemas con Modelos de Base de Datos

**Problema**: Es tentador usar el mismo objeto SQLModel como schema de respuesta API. Esto expone campos internos (IDs técnicos, timestamps de auditoría, claves foráneas) y hace que cualquier cambio en la BD se refleje automáticamente en la API, rompiendo contratos con los frontends.

**Impacto en el negocio**: Los frontends Next.js dependen de contratos JSON estables. Si un cambio en la BD cambia la respuesta de la API, la UI puede fallar inesperadamente. Además, exponer datos internos (como `user_uuid` o IDs de sesión) es un riesgo de seguridad.

**Acción preventiva**:
- **Nunca** exponer modelos SQLModel directamente como respuesta.
- Cada dominio debe tener `schemas.py` con Pydantic models específicos para request y response.
- Usar `model_config = {"from_attributes": True}` en los schemas de respuesta para poblar desde modelos ORM, pero controlando exactamente qué campos se exponen.
- Establecer como convención: `model.py` para la BD, `schemas.py` para la API.

### 7.4 Riesgo 4: Crecimiento del monorepo sin gobernanza

**Problema**: Sin reglas claras, el monorepo puede degenerar en dependencias circulares entre dominios (ej. `inventory` importando de `support` y viceversa), archivos de miles de líneas y ausencia de ownership claro.

**Acción preventiva**:
- **Dependencias unidireccionales**: `domains/` no se importan entre sí. Si un dominio necesita lógica de otro, esa lógica debe vivir en `core/` o en `packages/`.
- **Límites de tamaño**: ningún archivo de dominio debe superar las 300 líneas. Si crece, se divide.
- **Archivo `pyproject.toml`** unificado en `services/` para gestionar dependencias Python del backend, eliminando instalaciones ad-hoc.

---

## 8. Resumen Ejecutivo y Próximos Pasos

### 8.1 Decisión arquitectónica

| Dimensión | Decisión |
|---|---|
| **Patrón** | Modular Monolith con Capas (Layered Architecture) |
| **Framework** | FastAPI v2+ con Pydantic v2 y SQLModel v2 |
| **Estructura** | `services/` con `core/`, `domains/*/`, `agents/`, `pipelines/` |
| **Comunicación** | REST/JSON sobre HTTP, contratos versionados (`/api/v1/`) |
| **Frontend/Backend** | Sistemas separados, solo HTTP, CORS gestionado por entorno |
| **Evolución** | Extracción controlada a microservicios por dominio cuando se justifique |

### 8.2 Acciones inmediatas recomendadas

1. **Refactorizar `services/server.py` actual** para que se convierta en `services/main.py` + `services/domains/incidents/` siguiendo la estructura propuesta, demostrando que el patrón funciona con el código existente.
2. **Crear `core/config.py` con pydantic-settings** para centralizar la configuración.
3. **Establecer `pyproject.toml`** en `services/` con las dependencias del backend (FastAPI, uvicorn, SQLModel, pydantic-settings, python-multipart, etc.).
4. **Documentar en `AGENTS.md`** que los agentes de IA deben importar `services/domains/*/service.py`, nunca los routers.
5. **Configurar CORS por entorno** en `core/security.py`, eliminando el `allow_origins=["*"]` del servidor actual.

---

*Esta propuesta está viva. Se revisará y actualizará al completar cada hito del roadmap, asegurando que la arquitectura evolucione con el negocio de Nexova, no al revés.*