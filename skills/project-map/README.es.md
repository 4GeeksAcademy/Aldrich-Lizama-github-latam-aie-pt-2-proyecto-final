# project-map Skill

Mapa completo del monorepo de Nexova: directorios, puertos, rutas, servicios, URLs de previsualización y archivos clave. Se auto-actualiza cada vez que se invoca con el estado actual del runtime.

## Cuándo usarla

- Necesitas conocer la estructura completa del proyecto de un vistazo.
- Necesitas abrir una UI o servicio específico y quieres el puerto y URL correctos.
- Necesitas verificar qué servicios están corriendo actualmente.
- Necesitas navegar entre backoffice, website, talent pipeline o APIs.
- Estás incorporándote al proyecto o retomando el trabajo después de una pausa.

## Cómo funciona

1. Lee `skills/project-map/SKILL.md` para obtener el mapa completo del proyecto.
2. La skill actualiza automáticamente el estado de puertos, disponibilidad de servicios y URLs de previsualización cada vez que se invoca.
3. Usa la sección "Comandos Rápidos" para iniciar servicios o ejecutar builds.

## Secciones principales

| Sección | Descripción |
|---------|-------------|
| 2. UIs | Backoffice (3000), Website (3001), Talent Pipeline (3002) — rutas y archivos |
| 3. Backend | FastAPI (8000) — todos los endpoints; Flask (3001) — HTML estáticos |
| 4. BD | Ubicación de TinyDB, datos semilla, patrón de acceso |
| 5. Módulos | nexova_analyzer, tipos compartidos, utilidades src |
| 6. Contexto | Todos los archivos context.nexova/ organizados por dominio |
| 7. Memory Bank | projectbrief, techContext, progress |
| 11. Puertos | Estado de puertos en vivo (auto-actualizado) |
| 12. Comandos | Comandos rápidos para iniciar, construir, linting, previsualizar |
| 14. Auto-update | Instrucciones para mantener la skill actualizada |

## Relacionados

- `AGENTS.md` — Reglas de gobernanza para agentes AI en este proyecto.
- `memory-bank/` — Memoria persistente del proyecto.
- `context.nexova/` — Documentos de contexto de negocio.