---
target: tienda pública (shop)
total_score: 25
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 0
timestamp: 2026-08-13T02-40-29Z
slug: src-app-features-public-shop-shop-component-html
---
# Critique — Tienda pública (shop) · FinanCrece

Method: dual-agent (A: ses_007208615ffezhe591TicRJE5L · B: ses_007207581ffeu1zDI15lgABfdd) + re-run post-fix 2026-08-13

## Design Health Score

| # | Heurística | Score | Problema clave |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeletons, pill de stock y estado de error con "Reintentar" |
| 2 | Match System / Real World | 3 | Moneda, "desde X cuotas" y pills derivados de datos reales; decimales unificados |
| 3 | User Control and Freedom | 3 | Modal con Escape + overlay + botón; carrusel pausable con modal abierto |
| 4 | Consistency and Standards | 3 | max-width 1280 alineado al token; un solo affordance por card |
| 5 | Error Prevention | 3 | Agotado deshabilita CTA; card sin click duplicado |
| 6 | Recognition Rather Than Recall | 2 | Pills "X cuotas" claras; filtro activo sigue marcándose solo por color |
| 7 | Flexibility and Efficiency | 2 | Sin ordenar, sin atajos de teclado, búsqueda solo título/marca |
| 8 | Aesthetic and Minimalist Design | 3 | Sin orbes ni gradiente de texto; hero con ejemplo financiero real |
| 9 | Error Recovery | 3 | Empty state con "Limpiar filtros"; error de API con retry |
| 10 | Help and Documentation | n/a | Tienda de autoservicio; no aplica in-page |
| **Total** | | **25/36** | **Acceptable** |

## Design Specificity Verdict

**LLM (anclada):** Específica. El núcleo financiero se mantiene (precio + cuotas + plan + enganche/cuota/% anual) y ahora el hero muestra un ejemplo real del catálogo en vez de orbes decorativos. Ya no hay contradicción entre el diseño documentado ("nada de IA") y la pantalla. La única zona genérica restante es la sidebar de categorías + grid, que en la vista móvil se comporta como chips propios de un escaparate.

**Detector determinista:** 3 hallazgos en `shop.component.html` + dependencias, todos preexistentes y no reales:
- `broken-image` (warning): `<img>` sin src — **falso positivo** del binding Angular `[src]` (el detector no evalúa bindings).
- `design-system-color` (advisory): `color: rgb(0,0,0)` no resuelto en línea — ruido del parser sobre bloques `@if/@for`; no es drift real de DESIGN.md.

**Overlays visuales:** No disponibles (sin herramienta de browser en este entorno) — no hay overlay inyectado.

## Overall Impression

La tienda ahora muestra números de dinero que salen de la base de datos, no de la mano. El hero ya no imita IA: muestra una cuota real del catálogo como primer ejemplo financiero, y la vista móvil es usable (categorías en chips, targets táctiles, flechas visibles en touch). El salto de 21 → 25 viene de cerrar las tres promesas mayores: responsividad, veracidad del dinero y honestidad en fallo/vacío.

## What's Working

1. **Dinero veraz** — precio, cuotas y enganche derivados de `product.currency` y `financingPlans` reales en shop y modal; loan-request usa `currencyCode()` por producto.
2. **Hero con ancla real** — `heroExample()` toma el primer producto activo con plan y muestra su cuota más baja: el mejor argumento de venta es un dato, no un slogan.
3. **Fallo y vacío honestos** — error de API ≠ "no hay productos"; empty state ofrece "Limpiar filtros".
4. **Modal robusto** — Escape, overlay, aria-labels; el carrusel se detiene mientras está abierto.

## Priority Issues

Ninguna P0/P1 pendiente. Restan P2 menores:

- **[P2] Filtro activo solo por color** — la categoría seleccionada depende del background índigo; sin keyboard/checkbox el estado es frágil.
- **[P2] Sin ordenación** — la parrilla no permite ordenar por precio/cuota, clave en un escaparate de crédito.

## Persona Red Flags

- **Casey (móvil):** resuelto — media queries ≤1024/768/640, categorías en chips, CTAs ≥44px, flechas visibles en `hover:none`.
- **Riley (edge cases):** resuelto — API caída muestra retry; moneda/cuotas derivadas del producto; "12m" reemplazado por "X cuotas".
- **Jordan (primera vez):** casi resuelto — el hero ahora ancla con una cuota real; el paso 1 del formulario recapitula el producto y añade nota de privacidad. Sigue sin haber un "cuánto pago al mes" global antes del modal.

## Minor Observations

- `product-img-placeholder` 150px vs wrapper 220px → layout shift (preexistente).
- `plan.info` y estimaciones de loan-request quedan coherentes al unificar decimales a 1.2-2.
- El ejemplo del hero usa el primer producto activo con plan; si el catálogo reordena, el ejemplo cambia (por diseño).

## Questions to Consider

- ¿El hero debería permitir "ver la cuota del producto que elegiste" en vez de mostrar el primero del catálogo?
- ¿Un selector de ordenación (precio/cuota) cerraría el P2 de flexibilidad?
- ¿Re-correr con overlay visual ahora que el navegador está disponible daría un veredicto de contraste más fino?
