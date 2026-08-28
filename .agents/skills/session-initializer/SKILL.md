# SKILL: session-initializer

## Objetivo

Ejecutar el protocolo obligatorio de inicio de sesión para cualquier agente de IA que opere en el monorepo Nexova. Garantiza que el agente tenga contexto completo del proyecto antes de realizar cualquier implementación, modificación o toma de decisiones.

## Disparo (Trigger)

Esta skill se ejecuta **al inicio de cada sesión de trabajo**, antes de cualquier otra acción del agente.

## Invocación Manual

Si la skill no se ejecuta automáticamente al inicio de la sesión (por ejemplo, porque el sistema de skills de Copilot no la detectó), puedes invocarla manualmente de cualquiera de las siguientes formas:

### Opción 1: Frase natural (recomendada)

Escribe cualquiera de estas frases en el chat de Copilot:

- _"Ejecuta la skill de inicialización de sesión"_
- _"Inicializa el contexto del proyecto Nexova"_
- _"Lee el context.nexova y el memory-bank"_
- _"Ejecuta session-initializer"_
- _"Haz la lectura obligatoria de contexto de inicio de sesión"_

### Opción 2: Ruta directa

Si ninguna frase natural funciona, indica explícitamente:

> _"Lee el archivo `.agents/skills/session-initializer/SKILL.md` y ejecuta sus instrucciones paso a paso."_

### Opción 3: Subagente

También puedes delegar la inicialización a un subagente:

> _"Ejecuta como subagente la skill session-initializer para inicializar el contexto completo del proyecto."_

### Qué esperar después de invocarla

El agente debería:

1. Leer `AGENTS.md`.
2. Leer recursivamente `context.nexova/`.
3. Leer los 3 archivos de `memory-bank/`.
4. Confirmar que todo está en orden.

## Proceso de Ejecución

### Paso 1. Leer AGENTS.md

Leer el archivo `AGENTS.md` de la raíz del repositorio para conocer las reglas globales de gobernanza vigentes.

### Paso 2. Leer context.nexova (recursivamente)

Leer **todos los archivos contenidos en `context.nexova/`**, incluyendo:

- Archivos en la raíz de `context.nexova/`
- Archivos dentro de **todas las subcarpetas** sin importar su nivel de anidamiento
- Archivos dentro de subcarpetas de esas subcarpetas

> **Regla obligatoria**: la lectura debe ser **recursiva**. No asumir que solo los archivos del nivel superior son suficientes. Cada sesión debe leer todo el árbol.

### Paso 3. Leer memory-bank (completo)

Leer obligatoriamente y en este orden:

1. `memory-bank/projectbrief.md`
2. `memory-bank/techContext.md`
3. `memory-bank/progress.md`

### Paso 4. Validar que no falta contexto

Verificar que todos los archivos obligatorios existen y fueron leídos:

- ¿Existe `AGENTS.md`? → Leído ✓
- ¿Existe `context.nexova/`? → Todos los archivos leídos ✓
- ¿Existe `memory-bank/projectbrief.md`? → Leído ✓
- ¿Existe `memory-bank/techContext.md`? → Leído ✓
- ¿Existe `memory-bank/progress.md`? → Leído ✓

Si alguno falta, registrar el bloqueo en `progress.md` y solicitar acción humana antes de continuar.

## Outputs Esperados

1. Agente con contexto completo del proyecto.
2. Sin implementaciones realizadas sin contexto previo.
3. Cero asunciones sobre información no documentada en los archivos leídos.

## Criterios de Aceptación

1. No se inicia ninguna implementación sin completar los pasos 1–3.
2. La lectura de `context.nexova/` es recursiva (abarca todas las subcarpetas y su contenido).
3. Si falta un archivo obligatorio, se detiene la ejecución y se solicita acción humana.
4. No se asume información histórica no documentada en memory-bank.

## Relación con AGENTS.md

Esta skill implementa operativamente lo establecido en la **Sección 1 (Archivos de Contexto Obligatorios)** de `AGENTS.md`. Cualquier cambio en esa sección debe reflejarse en esta skill y viceversa.