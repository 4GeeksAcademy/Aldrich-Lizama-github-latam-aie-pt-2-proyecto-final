# project-map Skill

Maps the entire Nexova monorepo structure: directories, ports, routes, services, preview URLs, and key files. Auto-updates each time it's called with the current runtime state.

## When to use

- You need to know the full project structure at a glance.
- You need to open a specific UI or service and want the correct port & URL.
- You need to check which services are currently running.
- You need to navigate between backoffice, website, talent pipeline, or APIs.
- You are onboarding to the project or resuming work after a break.

## How it works

1. Read `skills/project-map/SKILL.md` for the complete project map.
2. The skill auto-updates port status, service availability, and preview URLs each time it's invoked.
3. Use the "Comandos Rápidos" section to start services or run builds.

## Main sections

| Section | Description |
|---------|-------------|
| 2. UIs | Backoffice (3000), Website (3001), Talent Pipeline (3002) — routes & files |
| 3. Backend | FastAPI (8000) — all endpoints; Flask (3001) — static HTML files |
| 4. Database | TinyDB location, seed data, access pattern |
| 5. Shared modules | nexova_analyzer, shared types, src utils |
| 6. Context | All context.nexova/ files organized by domain |
| 7. Memory Bank | projectbrief, techContext, progress |
| 11. Ports | Live port status (auto-updated) |
| 12. Quick commands | Start, build, lint, preview commands |
| 14. Auto-update | Instructions for keeping the skill current |

## Related

- `AGENTS.md` — Governance rules for AI agents in this project.
- `memory-bank/` — Persistent project memory.
- `context.nexova/` — Business context documents.