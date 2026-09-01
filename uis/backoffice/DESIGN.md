# Nexova Backoffice — Design System

> Documentado para `impeccable.style` — Personaliza la detección de anti-patrones.

## Fuentes

- **Familia principal**: `"Segoe UI", Tahoma, Geneva, Verdana, sans-serif`
- No se usa Inter, Roboto, ni fuentes monoespaciadas decorativas.

## Colores

| Token       | Uso                  | Hex       |
|-------------|-----------------------|-----------|
| `--bg`      | Fondo principal       | `#0f1b24` |
| `--card`    | Fondo de tarjetas     | `#142735` |
| `--text`    | Texto principal       | `#ecf2ef` |
| `--muted`   | Texto secundario      | `#b3c7be` |
| `--accent`  | Acento (verde Nexova) | `#7ec0a7` |
| `--border`  | Bordes                | `#2e4d5f` |

No se usan púrpuras, violetas, ni degradados de neón.

## Tipografía

- **H1**: 1.8rem / bold
- **H2**: 1.3rem / bold
- **Cuerpo**: 0.9rem — 0.85rem
- **Etiquetas/badges**: 0.75rem — 0.8rem
- **Muted**: 0.85rem

## Radios de esquina

- **Tarjetas (`.card`)**: 0.9rem
- **Badges**: 0.5rem
- **Inputs/Selects**: 0.6rem
- **Barras de progreso**: 4px — 5px

## Espaciado

- **Gap estándar**: 1rem
- **Padding de tabla**: 0.75rem 0.5rem
- **Padding de tarjeta**: 1rem
- **Gap entre acciones**: 0.4rem

## Animaciones

- Usar `transform` y `opacity` para animaciones (nunca `width`, `height`, `padding`, `margin`)
- Transiciones suaves: `0.15s` para hover, `0.4s` para barras
- Sin bounce, elastic, ni easings exagerados