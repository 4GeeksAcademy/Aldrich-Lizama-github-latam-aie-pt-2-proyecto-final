# Technical Context — Nexova Monorepo

## 1) Stack tecnológico actual y arquitectura del monorepo

## Panorama general

El repositorio sigue una estructura de monorepo orientada a hitos de AI Engineering, con separación por dominios:

- uis/: interfaces de usuario (web pública y backoffice).
- services/: APIs y workers (espacio para backend de negocio).
- data/: pipelines, datasets y evaluación.
- skills/, agents/, workflows/, mcps/: capas orientadas a automatización y agentes.
- packages/shared/: tipos y contratos compartidos.

## Stack implementado hoy (evidencia en código)

### Web pública (Hito 1)

- HTML5 semántico + JavaScript vanilla.
- Tailwind vía CDN (no build step dedicado).
- SEO on-page (meta description, robots) y JSON-LD Schema.org Organization.
- Validaciones de formulario en cliente con mensajes específicos de negocio.
- Idioma base español + variante en inglés.

Archivos relevantes:

- index.html / index.en.html
- application.html / application.en.html
- validation.js

### Backoffice talent tracker (UI operacional)

- Next.js 16.2.10 (App Router).
- React 19.2.4.
- TypeScript estricto.
- Tailwind CSS v4 + PostCSS.
- ESLint 9 + eslint-config-next.
- SSE para actualización en tiempo real en frontend.

Arquitectura interna del tracker:

- Capa de presentación: componentes en src/components.
- Capa de estado y orquestación: hooks en src/hooks.
- Capa de acceso a datos: cliente REST en src/lib/api.ts.
- Endpoint interno SSE: src/app/api/events/route.ts.
- Tipado de dominio: src/types/index.ts.

Fuente de datos operativa:

- API externa Talent Tracker (playground.4geeks.com) como backend de registros y notas.
- NEXT_PUBLIC_API_URL configurable, con fallback al endpoint público.

### Tooling y base TypeScript del repo

- Root package de utilidades de gestión de candidatos con scripts de typecheck y demo.
- tsconfig root con strict mode, noUnusedLocals/noUnusedParameters, target ES2022.
- Paquete compartido @repo/shared-types para contratos reutilizables.

## 2) Decisiones de diseño técnico y restricciones

## Decisiones observables en implementación

- Separación explícita entre:
  - experiencia pública (marketing/captación),
  - experiencia operativa (backoffice pipeline tracker).
- Validación temprana en frontend para proteger calidad de datos antes de entrar a procesos de selección.
- Realtime pragmatico:
  - se implementa SSE en Next.js,
  - el endpoint SSE actúa como proxy con polling al backend externo cada 10 segundos,
  - se emiten eventos solo cuando hay cambios (diff por payload serializado).
- Tipado fuerte del dominio de candidatos (status/stage acotados) para reducir estados inválidos.

## Restricciones del contexto de negocio y producto

- La captura del formulario está restringida a candidatos, no a empresas contratantes.
- Deben mantenerse validaciones exactas de campos críticos: email, teléfono con código país, experiencia 0-50, URL de LinkedIn, aceptación de política.
- Requerimientos no funcionales explícitos:
  - responsive,
  - accesibilidad,
  - SEO,
  - markup Schema.org.
- Operación multi-región (España/Miami): bilingüismo recomendado (base + segundo idioma).

## Restricciones técnicas actuales

- Dependencia de API externa para tracker (riesgo de latencia/disponibilidad fuera del control del repo).
- Sin telemetría centralizada integrada aún en el código del monorepo.
- Workspace root ambiguo detectado por Next debido a lockfiles múltiples (root + ui), lo que requiere fijar turbopack.root para evitar warnings y posibles efectos de rendimiento.

## 3) Convenciones de integración entre componentes

## Convenciones de datos

- Contratos de API definidos con interfaces TypeScript (RecordOut, RecordCreate, NoteOut, etc.).
- Enumeraciones cerradas para estados de reclutamiento:
  - status: received, in_progress, selected, discarded.
  - stage: pending, review, personal_interview, technical_interview, offer_presented.

## Convenciones de flujo frontend

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
