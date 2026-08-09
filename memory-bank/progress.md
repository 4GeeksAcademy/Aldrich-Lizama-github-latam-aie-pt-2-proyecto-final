# Progress — Nexova AI Engineering Project

## 1) Estado actual de desarrollo (hitos previos completados)

## Hito Web Pública: completado funcionalmente

Evidencia implementada:

- Landing corporativa Nexova publicada con secciones requeridas:
  - header,
  - hero,
  - servicios,
  - por qué Nexova,
  - contacto,
  - footer.
- Formulario de registro de talento separado en página dedicada.
- Validaciones de negocio implementadas con mensajes específicos.
- Mensaje de éxito post validación y envío simulado.
- Mensaje de restricción para empresas contratantes (derivación a contacto@nexova.com).
- SEO básico y Schema.org Organization integrado en landing.
- Soporte ES/EN en páginas públicas.
- Preview funcional del sitio estático levantada en localhost:4173.

## Base operativa del monorepo: parcialmente establecida

- Estructura de carpetas por dominios AI-ready presente.
- Paquete compartido de tipos inicializado (packages/shared).
- Root TypeScript con scripts utilitarios de demo/typecheck.

## 2) Tareas en curso

## Configuración de monorepo

- Hay más de un lockfile activo (root y ui), y Next advierte detección ambigua del workspace root.
- No existe todavía un orquestador unificado de workspaces/scripts a nivel raíz para construir, testear y ejecutar todos los paquetes de forma consistente.

## Web pública

- El alcance esencial del Hito 1 está implementado.
- Pendiente endurecer capa productiva:
  - observabilidad,
  - testing automatizado de validaciones/accesibilidad,
  - pipeline de despliegue formal.

## Backoffice (Talent Pipeline Tracker)

- UI en Next.js en ejecución con:
  - listado de candidatos,
  - filtros,
  - paginación,
  - detalle,
  - edición,
  - eliminación,
  - notas,
  - creación de candidatos,
  - actualización en tiempo real vía SSE.
- Integración actual depende de API externa pública.
- Preview funcional levantada en localhost:3000.

## Inicializacion de nuevas UIs (website y backoffice)

- Se creo `uis/website` como app Next.js + TypeScript con App Router.
- Se migro la landing publica de Nexova a la ruta `/` en `uis/website` con componentes reutilizables.
- Se migro la pagina de talento a `/talent` con formulario React tipado y validaciones cliente basicas alineadas al hito web.
- Se creo `uis/backoffice` como app Next.js + TypeScript con layout independiente.
- Se implemento una vista inicial de dashboard en `/` para `uis/backoffice`.
- El dashboard integra logica de negocio TypeScript del monorepo sin duplicacion:
  - script fuente: `src/dashboardSummary.ts`
  - consumo desde UI: `uis/backoffice/src/lib/business-summary.ts` y `uis/backoffice/src/app/page.tsx`.

## Validaciones ejecutadas

- Root: `npm run typecheck` OK.
- Website: `npm run typecheck` OK.
- Backoffice: `npm run typecheck` OK.

## Ejecucion de pre-commit (secuencial)

- Paso 1 (tipos): `tsc --noEmit` validado en root, website y backoffice.
- Paso 2 (lint + formato):
  - `npm run lint` ejecutado en website y backoffice (sin errores bloqueantes).
  - `prettier --write` y `prettier --check` aplicados a archivos nuevos/modificados.
- Paso 3 (verificacion funcional local): `npm run build` exitoso en website y backoffice.
- Paso 4 (estado): actualizado este archivo con resultado de validaciones y riesgos.

## 3) Próximos pasos del roadmap

## Corto plazo (estabilización técnica)

1. Consolidar configuración monorepo:
   - definir estrategia de workspaces,
   - unificar lockfile,
   - estandarizar scripts root para dev/build/lint/test.
2. Corregir configuración de Next para fijar turbopack.root y eliminar warnings de entorno.
3. Añadir testing mínimo de regresión:
   - validaciones del formulario,
   - contratos API del tracker,
   - smoke tests de rutas críticas.

## Medio plazo (alineación con necesidades por área)

1. Selección:
   - integrar scoring/ranking explicable para CVs,
   - preparar base para búsqueda semántica de candidatos (RAG).
2. Ventas y RRHH interno:
   - diseñar dashboards iniciales con métricas operativas.
3. Soporte:
   - preparar base de conocimiento central y capa de consulta.

## Largo plazo (visión AI-ready empresarial)

1. Pipeline de datos unificado para dashboards de dirección y equipos.
2. Telemetría y logging centralizados.
3. Agentes de IA por función (selección, soporte, RRHH, dirección).
4. Automatización de reportes ejecutivos semanales en tiempo real.

## Riesgos y dependencias críticas

- Dependencia de backend externo para tracker puede impactar confiabilidad de demos.
- Falta de observabilidad transversal limita diagnóstico de incidentes.
- Ausencia de gobierno unificado de monorepo puede generar deriva técnica entre áreas.
- `uis/website` mantiene warning de ESLint `@next/next/no-img-element` en `src/components/Hero.tsx` por uso de `<img>`. No bloquea build ni typecheck, pero conviene migrar a `next/image` para optimizacion de performance.
