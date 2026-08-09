# Code Conventions

Pattern: **/_.ts, \**/_.tsx

## Objetivo

Aplicar convenciones de desarrollo para TypeScript y React en este monorepo AI-ready de Nexova, garantizando calidad, mantenibilidad y coherencia entre uis, services, data y packages.

## Reglas Obligatorias de TypeScript

1. Usa tipado estricto en todo archivo TypeScript.
2. Prohibido any.
3. Si un tipo es desconocido, usa unknown y refina con type guards.
4. Tipa siempre:
   - argumentos de funciones,
   - valores de retorno,
   - props de componentes,
   - respuestas de API,
   - estados complejos.
5. Define contratos compartidos reutilizables en packages/shared cuando apliquen a mas de un modulo.
6. No dupliques tipos de dominio ya existentes.

## Convenciones para React y Componentes

1. Nombra componentes en PascalCase.
2. Un componente por archivo con el mismo nombre del componente.
3. Exporta de forma limpia:
   - preferir export default en componentes de pagina/feature principal,
   - preferir export nombrado en utilidades y subcomponentes compartidos.
4. Define una interfaz o type para las props con sufijo Props cuando mejore legibilidad.
5. Mantene componentes pequenos y composables.
6. Separa responsabilidad de UI y logica:
   - UI en components,
   - logica asincrona y de estado en hooks o services.
7. Nunca renderices en UI valores crudos de API cuando exista etiqueta de dominio. En Nexova (Hito 3), status y stage deben mostrarse con labels legibles.

## Manejo de Errores

1. Toda operacion asincrona debe manejar errores con try/catch o estrategia equivalente.
2. No silencies errores sin justificacion.
3. Emite mensajes de error utiles para usuario y contexto tecnico para debugging.
4. Mantene contratos de error consistentes entre capas (API client, hooks, componentes).
5. Evita lanzar errores ambiguos; incluye estado, accion y recurso afectado.

## Buenas Practicas de Monorepo

1. Respeta el layout definido por contexto Nexova:
   - uis para interfaces,
   - services para backend HTTP,
   - data/pipelines para orquestacion y flujos,
   - scripts para CLIs sueltos,
   - packages/shared para contratos compartidos.
2. No mezcles logica de negocio de pipelines dentro de routers HTTP.
3. Reutiliza funciones/tipos existentes antes de crear nuevos.
4. Limita el alcance del cambio al dominio impactado.
5. Mantene imports absolutos o alias configurados por paquete cuando existan.
6. Evita acoplamiento circular entre modulos.

## Validacion Minima Antes de Integrar

1. tsc --noEmit sin errores.
2. npm run lint sin errores en el paquete afectado.
3. Flujo funcional basico validado en las rutas/casos cambiados.
