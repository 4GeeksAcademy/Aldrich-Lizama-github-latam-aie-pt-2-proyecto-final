# AGENTS.md

## Protocolo Global de Actuacion de Agentes IA

Este archivo define reglas obligatorias para cualquier agente de IA que opere en este monorepo.

Cumplimiento:

- Estas reglas son mandatorias.
- Si una regla entra en conflicto con una tarea, el agente debe detenerse y solicitar confirmacion explicita del desarrollador humano.

## 1. Archivos de Contexto Obligatorios (Inicio de cada sesion)

> **Skill asociada:** `.agents/skills/session-initializer/SKILL.md` — implementa operativamente este protocolo.

Al inicio de cada sesion, el agente debe leer obligatoriamente y en este orden:

1. `.agents/skills/session-initializer/SKILL.md` — leer la skill de inicialización.
2. `AGENTS.md` — leer las reglas de gobernanza globales.
3. **Todos los archivos contenidos en la carpeta `context.nexova/`, de forma recursiva.** Esto incluye:
   - Archivos en la raíz de `context.nexova/`.
   - Archivos dentro de todas las subcarpetas (cualquier nivel de anidamiento).
   - Archivos dentro de subcarpetas de esas subcarpetas.
   - **No asumir que solo los archivos del nivel superior son suficientes.** La lectura debe atravesar todo el árbol de directorios.
4. `memory-bank/projectbrief.md`.
5. `memory-bank/techContext.md`.
6. `memory-bank/progress.md`.

Reglas de aplicacion:

- No iniciar implementaciones sin completar esta lectura.
- No asumir contexto historico no documentado en estos archivos.
- Si falta algun archivo obligatorio, registrar el bloqueo y solicitar accion humana.
- La lectura de `context.nexova/` debe ser recursiva (subcarpetas incluidas) en cada sesion.

### Invocacion manual de la skill

Si la skill `session-initializer` no se ejecuta automaticamente al iniciar la sesion, el agente debe seguir estas frases de activacion (cualquiera funciona):

- *"Ejecuta la skill de inicializacion de sesion"*
- *"Inicializa el contexto del proyecto Nexova"*
- *"Lee el context.nexova y el memory-bank"*
- *"Ejecuta session-initializer"*
- *"Lee el archivo `.agents/skills/session-initializer/SKILL.md` y ejecuta sus instrucciones"*

## 2. Flujo Pre-Commit Obligatorio (Secuencial)

Antes de cualquier commit, ejecutar estrictamente estos pasos en orden:

### Paso 1. Verificacion de tipos TypeScript

- Ejecutar: tsc --noEmit
- Condicion de salida: cero errores de tipos.

### Paso 2. Linters y formateadores

- Ejecutar: npm run lint
- Ejecutar: prettier (modo validacion o escritura segun estandar del proyecto).
- Condicion de salida: sin errores de lint y formato consistente.

### Paso 3. Pruebas o verificacion funcional local

- Ejecutar la suite de pruebas disponible o, si no existe, una verificacion funcional local reproducible.
- Condicion de salida: comportamiento esperado en las rutas y casos impactados por el cambio.

### Paso 4. Actualizacion de estado de proyecto

- Actualizar memory-bank/progress.md con:
  - cambios implementados,
  - estado de validaciones,
  - riesgos o deuda tecnica detectada,
  - siguientes pasos.

Reglas de aplicacion:

- No omitir pasos.
- No invertir el orden.
- No avanzar a commit si un paso falla.

## 3. Archivos y Zonas Protegidas (No modificar sin confirmacion humana expresa)

El agente no puede modificar estos archivos o zonas sin aprobacion explicita del desarrollador humano:

### Secretos y entorno

- .env
- .env.*
- cualquier archivo con credenciales, tokens, llaves o secretos.

### Configuracion critica de monorepo y dependencias

- package.json de la raiz del repositorio.
- package-lock.json de la raiz del repositorio.
- tsconfig.json de la raiz del repositorio.

### CI/CD e infraestructura

- .github/workflows/*
- docker-compose*.yml
- Dockerfile*
- infra/**

### Seguridad y politicas

- archivos de politicas de seguridad, controles de acceso o configuraciones de despliegue productivo.

Reglas de aplicacion:

- Si el cambio requiere tocar una zona protegida, detener ejecucion y pedir confirmacion expresa.
- Documentar en memory-bank/progress.md la razon del cambio, alcance y riesgo antes y despues de aplicarlo.

## 4. Norma Operativa General

- Priorizar cambios pequenos, trazables y reversibles.
- Mantener consistencia con la arquitectura del monorepo y los contratos definidos en memory-bank/techContext.md.
- Registrar cada avance relevante en memory-bank/progress.md.
