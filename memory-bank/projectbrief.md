# Project Brief — Nexova Solutions

## 1) Empresa y problema que resuelve

**Nexova Solutions** es una consultora de recursos humanos y adquisición de talento fundada en 2011, con sede en Valencia (España) y oficina de expansión en Miami (EE. UU.).

Datos de negocio clave del contexto:

- **120 empleados**.
- **~8 millones USD** de facturación anual.
- Clientes principales: empresas medianas de tecnología, retail y servicios financieros.
- Líneas de negocio:
  1. **Headhunting ejecutivo** y de mandos medios.
  2. **Outsourcing de equipos** de atención al cliente.
  3. **Formación corporativa** en soft skills y liderazgo.

Problema transversal actual:

- Operación fragmentada y manual (email, hojas de cálculo, herramientas legacy desconectadas).
- Poca visibilidad en tiempo real para clientes y dirección.
- Baja trazabilidad de procesos (selección, onboarding, soporte, ventas).
- Cuellos de botella operativos que afectan SLA, conversión comercial y velocidad de decisión ejecutiva.

Problemas específicos por área (briefing completo disponible en `context.nexova/`):

| Departamento | Responsable | Problema principal |
|---|---|---|
| Marketing | Carmen Ruiz | Web desactualizada de 2019, sin métricas ni captura estructurada |
| Ventas | Marcos Ibáñez | CRM mal usado, prospección manual, deals perdidos por falta de seguimiento |
| RRHH | Patricia Solís | Procesos en hojas de cálculo y email, sin KPIs de rotación/absentismo |
| Selección | Javier Almeida | Criba manual de CVs (30-80 por proceso), sin matching automatizado |
| Formación | Elena Vargas | Catálogo en PDF, inscripciones con Google Forms, sin personalización |
| Soporte | Roberto Díaz | Sin base de conocimiento, SLAs de 24h incumplidos (promedio 48h real) |
| Tecnología | Sergio Molina (CTO) | Stack desconectado: HubSpot, Zendesk legacy, ATS propio, sin telemetría |
| Dirección | Laura Mendoza (CEO) | Reportes semanales manuales (4-8h preparación), datos de hace una semana |

## 2) Objetivos principales del proyecto y requisitos de negocio

### Objetivo macro (empresa)

Construir una **plataforma AI-ready**, por hitos, que reduzca trabajo manual y habilite decisiones en tiempo real en áreas core de Nexova: selección, ventas, RRHH, soporte, formación y dirección.

### Hitos del roadmap (mapeados a `context.nexova/`)

| Hito | Contexto | Estado |
|---|---|---|
| **Hito 1 — Sitio Web Público** | `CONTEXT-nexova.es (1).md` | ✅ Implementado (HTML + Next.js) |
| **Hito 2 — Fundamentos de Programación** | `CONTEXT-nexova.es (2).md` | ✅ Implementado (TypeScript) |
| **Hito 3 — Talent Pipeline Tracker** | `CONTEXT-nexova.es (3).md` | ✅ Implementado (Next.js SPA) |
| **Hito 5 — Gestión de Inventario Backend** | `CONTEXT-nexova.es (5).md` | 🟡 En progreso — API con almacenamiento ligero (TinyDB) y CRUD de proveedores completado. Pendiente: inventario con Asset/AssetEntry/AssetExit |
| **Hito 6 — Telemetría + Data Pipeline** | `CONTEXT-nexova.es (6)/` | ❌ Pendiente |
| **Hito 7 — RAG y Base de Conocimiento** | `CONTEXT-nexova.es (7)/` | ❌ Pendiente |
| **Hito 8 — Memoria y Aseguramiento de Agentes** | `CONTEXT-nexova.es (8)/` | ❌ Pendiente |
| **Hito 9 — Flujos de Trabajo Agénticos (RFP)** | `CONTEXT-nexova.es (9)/` | ❌ Pendiente |
| **Sistemas en Tiempo Real** | `CONTEXT-nexova.es (10)/` | ❌ Pendiente |

### Proyecto transversal activo — Análisis de Incidencias (Soporte)

Además de los hitos del curso, se ha implementado un **módulo completo de análisis de tickets de soporte** para el área de Roberto Díaz:

- **Backend**: API FastAPI con análisis CSV, validaciones y exportación.
- **Frontend**: UI en el backoffice con carga drag-and-drop, métricas, desgloses y exportación.
- **Propósito**: dotar al equipo de soporte de visibilidad sobre calidad de datos, categorización, estado de tickets y satisfacción de clientes.

### Objetivos estratégicos por área (briefing extendido)

- **Selección**: scoring/ranking automático de CVs, matching explicable, portal de estado para candidatos/clientes.
- **Soporte**: resolución de primera línea con chatbot + RAG y mejora de cumplimiento SLA (ya iniciado con análisis de incidencias).
- **Ventas**: automatización de secuencias y priorización de prospectos.
- **RRHH interno**: portal y workflows de onboarding con KPIs.
- **Dirección**: dashboard ejecutivo unificado con métricas en tiempo real.

## 3) Casos de uso clave

### Caso de uso A — Candidato se registra en banco de talento

1. El usuario llega a la landing y entiende propuesta de valor de Nexova.
2. Hace clic en CTA para registro de talento.
3. Completa formulario con validaciones estrictas por campo.
4. Recibe confirmación de recepción y expectativa de contacto.
   Resultado esperado: pipeline de candidatos entra con datos consistentes para operaciones de selección.

### Caso de uso B — Usuario empresa intenta usar formulario de candidatos

1. Usuario detecta que no es el flujo adecuado para contratar servicios.
2. Visualiza mensaje explícito de derivación a contacto@nexova.com.
   Resultado esperado: evitar ruido operativo y mantener calidad del dataset de candidatos.

### Caso de uso C — Marketing mejora posicionamiento digital

1. Publica contenido corporativo con SEO técnico y semántico.
2. Mejora indexabilidad y señal de marca mediante metadata + Schema.org.
   Resultado esperado: mayor tráfico cualificado y mayor conversión a registro.

### Caso de uso D — Analista de soporte sube CSV de incidencias

1. El agente de soporte arrastra un archivo CSV con tickets en el backoffice.
2. El sistema valida cada registro, clasifica por categoría y estado, calcula métricas de satisfacción.
3. Visualiza resultados en tarjetas, tablas desglosadas y distribución de puntuaciones.
4. Exporta el reporte a CSV para compartir con el supervisor.
   Resultado esperado: visibilidad inmediata sobre calidad de datos y desempeño del soporte.

### Caso de uso E — Evolución hacia operaciones AI-native (siguientes hitos)

1. Datos capturados se conectan con procesos de scoring y seguimiento.
2. Se habilitan dashboards, automatizaciones y agentes por área.
   Resultado esperado: menos fricción operativa, decisiones más rápidas y mayor escalabilidad del negocio.
