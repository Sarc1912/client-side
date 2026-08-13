---
target: tienda pública (shop)
total_score: 21
max_score: 36
na_heuristics: 10
p0_count: 1
p1_count: 2
timestamp: 2026-08-13T02-09-17Z
slug: src-app-features-public-shop-shop-component-html
---
# Critique — Tienda pública (shop) · FinanCrece

Method: dual-agent (A: ses_007208615ffezhe591TicRJE5L · B: ses_007207581ffeu1zDI15lgABfdd)

## Design Health Score

| # | Heurística | Score | Problema clave |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeletons y stock bien; error de API colapsa en "No se encontraron productos" |
| 2 | Match System / Real World | 2 | USD hardcodeado; "desde 12 cuotas" fijo; pill "12m" ambiguo |
| 3 | User Control and Freedom | 2 | Modal sin Escape ni cierre por back |
| 4 | Consistency and Standards | 3 | Clases globales coherentes; drift 1400px vs 1280px; card+modal mezclados |
| 5 | Error Prevention | 3 | Agotado deshabilita CTA bien; pero card entera clickeable duplica targets |
| 6 | Recognition Rather Than Recall | 2 | "12m" críptico; filtro activo solo por color |
| 7 | Flexibility and Efficiency | 2 | Sin ordenar, sin teclado, búsqueda solo título/marca |
| 8 | Aesthetic and Minimalist Design | 2 | Orbes + gradiente texto (anti-referencia) + 8 primarios simultáneos |
| 9 | Error Recovery | 2 | Empty state sin salida, sin "limpiar filtros" |
| 10 | Help and Documentation | n/a | Tienda de autoservicio; no aplica in-page |
| **Total** | | **21/36** | **Acceptable** |

## Design Specificity Verdict

**LLM (no anclada):** Parcialmente específica. El núcleo es genuino: precio + "desde X cuotas" + pills de plan + CTA financiero + modal con enganche/cuota/% anual es solo de una tienda con crédito. Pero el esqueleto (hero con orbes difuminados, gradiente de texto, sidebar de categorías, grid de cards) es un template de tienda/SaaS intercambiable. Peor: el hero viola la anti-referencia declarada ("nada de estética hecha por IA") con orbes blur 80px y gradiente en el H1, y hardcodea datos de dinero ("desde 12 cuotas", USD) — los dos mayores pecados para un producto comercial de crédito.

**Detector determinista:** 2 hallazgos en `shop.component.html`:
- `broken-image` (warning): `<img>` sin src — probable **falso positivo** de binding Angular `[src]` (el detector no evalúa bindings).
- `design-system-color` (advisory): `color: rgb(0,0,0)` en span "FinanCrece" — drift/heredado, valor no resuelto en línea (line 0).

**Overlays visuales:** No disponibles (sin herramienta de browser en este entorno) — no hay overlay inyectado.

## Overall Impression

La tienda conoce su producto en los datos, pero se disfraza de template en su vitrina. El mayor hallazgo no es un bug sino una contradicción: el elemento más visible (hero) es exactamente la estética que el dueño quiere evitar, y los números de dinero —la única razón de existir del negocio— están inventados a mano. Arreglar el hero y la veracidad del dinero convierte una tienda "bien" en una tienda creíble.

## What's Working

1. **Prevención de error por stock** — pill "En stock/Agotado" + CTA deshabilitado con "No disponible": cierra la vía frustrante antes de que ocurra.
2. **Money-Weight cumplido** — precio 1.15rem/700 índigo, modal 1.6rem/800, cuota en strong. El dinero siempre pesa.
3. **El modal como divulgación progresiva** — plan, enganche, cuota y % anual en una vista sin salir de la tienda; galería con thumbs.

## Priority Issues

- **[P0] La tienda no es responsive.** Cero `@media` en `shop.component.css`; sidebar 180px + grid 220px estrujan a 375px; botones ~31px (<44px táctil); flechas del carrusel invisibles en touch (`opacity:0` hasta hover). Para Casey es inutilizable. → `/impeccable layout`
- **[P1] La veracidad del dinero está rota.** "desde 12 cuotas" hardcodeado (`shop.component.html:136`), USD fijo (`:134`) vs `product.currency` que el modal sí usa, precisión decimal inconsistente (1.0 vs 1.2). Una tienda de crédito que improvisa cifras quema la confianza. → `/impeccable audit`
- **[P1] Anti-referencia violada en el elemento más visible.** Orbes blur 80px (`shop.component.css:152-173`) + gradiente de texto en H1 (`:200-204`), prohibidos por DESIGN.md. → `/impeccable distill`
- **[P2] Fallo y vacío mienten al usuario.** Error de API cae en "No se encontraron productos" (`shop.component.ts:67`); empty state sin acción de reset. → `/impeccable harden`
- **[P2] Ruta de compromiso sin reaseguro.** El CTA lanza a un formulario que pide DUI/pasaporte en el paso 1, sin recapitulación de cuota ni señales de confianza en la tienda. Momento de máximo riesgo sin ancla. → `/impeccable clarify`

## Persona Red Flags

- **Casey (móvil):** la tienda se rompe sin media queries; CTA ~31px falla target táctil; carrusel cambia solo cada 4s sin flechas visibles en touch.
- **Riley (edge cases):** API caída → "no hay productos"; "desde 12 cuotas" contradice un plan real de 6 cuotas; moneda inventada a USD.
- **Jordan (primera vez):** "Solicitar financiamiento" sin explicación previa; "12m" críptico; primer clic = formulario que exige documento de identidad antes de ver un número.

## Minor Observations

- `product-img-placeholder` 150px vs wrapper 220px → layout shift.
- Alt correcto en imágenes; flechas del carrusel sin `aria-label`.
- `max-width:1400px` vs token 1280 del sistema.
- Carrusel global con `setInterval` aunque el modal esté abierto (movimiento no pausable).
- Pill "12m" minúscula se lee como metros.
- Error de API no detiene el carrusel.

## Questions to Consider

- Si el diferenciador real es "crédito propio en el mismo escaparate", ¿por qué el primer ejemplo financiero visible está hardcodeado y no es la cuota real del producto?
- El diseño documentado dice "nada de IA" pero la pantalla abre con dos orbes difuminados y texto con gradiente — ¿el diseño documenta al producto, o al revés?
- ¿Qué cambia si el CTA dijera "$52/mes por 12 meses" en vez de "Solicitar financiamiento"?
