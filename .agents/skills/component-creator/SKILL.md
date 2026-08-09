# SKILL: component-creator

## Objetivo

Crear componentes React modularizados, tipados e integrados con el sistema de diseno existente del monorepo, manteniendo coherencia con el dominio Nexova y sus convenciones de codigo.

## Inputs Requeridos

1. Nombre del componente:
   - en PascalCase,
   - con ubicacion objetivo (feature, shared o pagina).
2. Props tipadas:
   - interfaz/type de entrada,
   - tipos de eventos/callbacks,
   - opcionalidad explicita.
3. Estilos o variante visual:
   - tokens/clases del sistema vigente,
   - estados visuales requeridos (default, loading, error, disabled, etc.).

## Proceso de Ejecucion

1. Revisar reglas en .agents/rules/code-conventions.md.
2. Verificar si existe componente reutilizable equivalente antes de crear uno nuevo.
3. Diseñar interfaz de props minima y extensible.
4. Implementar componente en .tsx sin any.
5. Integrar manejo de errores y estados de carga cuando aplique.
6. Exportar el componente de forma limpia segun convencion del modulo.
7. Validar compilacion y lint del paquete afectado.

## Outputs Esperados

1. Archivo .tsx tipado y compilable.
2. Exportacion limpia y consistente con el modulo.
3. Integracion sin romper contratos existentes.
4. Cero errores de compilacion TypeScript en el alcance afectado.

## Criterios de Aceptacion

1. Cero errores de TypeScript.
2. Uso prioritario de componentes reutilizables ya existentes.
3. Cumplimiento total de .agents/rules/code-conventions.md.
4. Props y eventos correctamente tipados, sin any.
5. Manejo de errores implementado para flujos asincronos.
6. Coherencia con contexto Nexova:
   - en vistas de pipeline de talento, no mostrar valores crudos de API (status/stage),
   - usar etiquetas de negocio legibles en UI.

## Notas de Coherencia con context.nexova

Esta skill se alinea con:

- Hito 3: necesidad de UI operativa para Talent Pipeline Tracker con filtros, detalle y actualizacion de estado/etapa.
- Hito 9: separacion de responsabilidades por capas en monorepo (HTTP en services, pipelines en data/pipelines, UI en uis).
