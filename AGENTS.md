# AGENTS.md

## Protocolo Global de Actuacion de Agentes IA

Este archivo define reglas obligatorias para cualquier agente de IA que opere en este monorepo.

Cumplimiento:

- Estas reglas son mandatorias.
- Si una regla entra en conflicto con una tarea, el agente debe detenerse y solicitar confirmacion explicita del desarrollador humano.

## 1. Archivos de Contexto Obligatorios (Inicio de cada sesion)

Al inicio de cada sesion, el agente debe leer obligatoriamente y en este orden:

1. Todos los archivos contenidos en la carpeta context.nexova.
2. memory-bank/projectbrief.md.
3. memory-bank/techContext.md.
4. memory-bank/progress.md.

Reglas de aplicacion:

- No iniciar implementaciones sin completar esta lectura.
- No asumir contexto historico no documentado en estos archivos.
- Si falta algun archivo obligatorio, registrar el bloqueo y solicitar accion humana.

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
