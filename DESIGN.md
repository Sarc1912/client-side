---
name: FinanCrece
description: "Tienda de equipos con financiamiento a plazos, portal de pagos y panel administrativo en una sola app web."
colors:
  primary: "#6366f1"
  primary-hover: "#818cf8"
  primary-violet: "#8b5cf6"
  primary-light: "rgba(99, 102, 241, 0.12)"
  bg-base: "#0f1117"
  bg-surface: "#1a1d27"
  bg-card: "#20232e"
  bg-hover: "#2a2d3a"
  border: "#2e3144"
  text-primary: "#f1f5f9"
  text-secondary: "#94a3b8"
  text-muted: "#64748b"
  success: "#22c55e"
  warning: "#f59e0b"
  danger: "#ef4444"
  info: "#38bdf8"
typography:
  display:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 800
    lineHeight: 1.15
  title:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.03em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "20px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "8px"
    padding: "0.6rem 1.25rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "8px"
    padding: "0.6rem 1.25rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "8px"
    padding: "0.6rem 1.25rem"
  input:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "8px"
    padding: "0.65rem 0.875rem"
  card:
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.text-primary}"
    rounded: "12px"
    padding: "1.5rem"
  badge:
    textColor: "{colors.text-secondary}"
    rounded: "999px"
    padding: "0.2rem 0.65rem"
  badge-success:
    backgroundColor: "rgba(34, 197, 94, 0.15)"
    textColor: "#4ade80"
  badge-warning:
    backgroundColor: "rgba(245, 158, 11, 0.15)"
    textColor: "#fbbf24"
  badge-danger:
    backgroundColor: "rgba(239, 68, 68, 0.15)"
    textColor: "#f87171"
  badge-info:
    backgroundColor: "rgba(56, 189, 248, 0.15)"
    textColor: "#38bdf8"
---

# Design System: FinanCrece

## Overview

**Creative North Star: "El Escaparate con Crédito Propio"**

FinanCrece es una tienda de equipos y tecnología que no termina en la compra: el financiamiento a plazos, el seguimiento de cuotas y la cobranza viven en el mismo escaparate. El sistema es *cercano y comercial* —una tienda que entiende de dinero— no una banca fría. Comunica confianza con sobriedad: fondo oscuro como base, superficies delimitadas por borde y un acento Índigo Comercial reservado para montos, marca y acciones. Las tres superficies (tienda, portal del cliente, panel admin) comparten el mismo lenguaje con densidades distintas: la tienda respira, el panel es escaneable.

Anti-referencia declarada: nada de estética "hecha por IA". Se rechazan las sombras genéricas de plantilla, los gradientes decorativos sin propósito y la saturación de efectos. Cada elemento visual debe justificarse por su función: mostrar un dato financiero o disparar una acción.

**Key Characteristics:**
- Acento índigo→violeta (#6366f1 → #8b5cf6) reservado para montos, marca, estados activos y una acción principal por pantalla.
- Superficies planas con borde 1px; elevación solo en interacción (hover, foco, modales).
- Estados siempre en pills (radius 999px) con fondo translúcido semántico.
- Micro-etiquetas de sección en mayúsculas (uppercase, letter-spacing .05–.06em).
- Inter como única familia tipográfica, en pesos 500–800.
- Tema oscuro por defecto; el claro es un derivado con las mismas funciones de color.

## Colors

Paleta fría de neutros azulados (slate) sobre la que el Índigo Comercial actúa como único acento de marca. En el tema claro los acentos se oscurecen un paso para conservar contraste AA sobre blancos.

### Primary
- **Índigo Comercial** (#6366f1 oscuro / #4f46e5 claro): color de marca y de acción. Vive en el logo, el CTA primario, los montos y cuotas, la navegación activa y el halo de foco de los inputs.

### Neutral
- **Base Nocturna** (#0f1117 oscuro / #f3f5f9 claro): fondo de página.
- **Superficie** (#1a1d27 / #ffffff): sidebars, topbars, inputs y tarjetitas secundarias.
- **Tarjeta** (#20232e / #ffffff): el contenedor `.card`.
- **Hover** (#2a2d3a / #eef1f6): filas, botones ghost y navegación en hover.
- **Borde** (#2e3144 / #d8dde8): línea de 1px en todas las superficies.
- **Texto Principal** (#f1f5f9 / #0f172a), **Texto Secundario** (#94a3b8 / #334155), **Texto Apagado** (#64748b en ambos temas).

### Secondary (semánticos)
- **Éxito** (#22c55e / #16a34a): préstamos activos, pagos completados, aprobaciones, stock suficiente.
- **Advertencia** (#f59e0b / #d97706): pendientes, cuotas parciales, stock bajo.
- **Peligro** (#ef4444 / #dc2626): rechazos, mora, eliminación.
- **Info** (#38bdf8 / #0284c7): en revisión, pagado en total, vendido, login.
- Los estados usan el par: fondo translúcido del color (alpha 0.12–0.15) + texto del tono (oscuro: 400–500 / claro: 600–700).

### Named Rules
**The Índigo Rarity Rule.** El acento se usa en ≤10% de cualquier pantalla: una acción principal, los montos y la marca. Si algo no es acción, monto o marca, no es índigo.

**The One-Brand-Gradient Rule.** El gradiente #6366f1 → #8b5cf6 existe solo para el logo, los avatares con iniciales y los iconos de marca. Nada más usa gradiente.

## Typography

**Display Font:** Inter (con `-apple-system, BlinkMacSystemFont, sans-serif` como fallback)
**Body Font:** Inter (mismo stack)
**Label/Mono Font:** Inter; los datos técnicos (referencias, IDs) usan `font-family: monospace` inline dentro de las tablas.

**Character:** Inter única, una familia sin carácter decorativo: es el telón neutro que deja hablar al dato. El sistema se mueve en pesos 500–800 con una escala apretada.

### Hierarchy
- **Display** (800, 2.5rem, line-height 1.15): solo el hero de la tienda.
- **Headline** (700, 1.6–2rem, 1.15): precio de detalle de producto (1.6rem), próximo pago del cliente (2rem).
- **Title** (700, 1.15–1.5rem): títulos de página (1.5rem), títulos de modal (1.15rem).
- **Body** (400, 0.875rem, 1.5): texto general, tablas, inputs; botones usan 0.875rem/500.
- **Label** (600, 0.72–0.8rem, letter-spacing 0.03–0.06em): badges (0.75rem/0.03em), micro-etiquetas de sección (0.78rem/0.05em), columnas de tabla (0.75rem/0.06em).

### Named Rules
**The Uppercase Whisper Rule.** Los encabezados de sección y las columnas de tabla van en mayúsculas, 600, .7–.78rem y letter-spacing .05–.06em, en Texto Apagado. Son el segundo plano; el dato manda.

**The Money-Weight Rule.** Todo monto visible pesa 700–800 (precios 700–800, cuotas 700, totales 700–800). Un número que cuesta dinero nunca es peso 400.

## Layout

- Contenido de cliente y tienda: max-width 1280px centrado, padding lateral 1.5rem.
- Admin: sidebar colapsable (72px → 240px al hover, transition width .25s) + topbar 60px + content con padding 1.75rem sobre fondo Base.
- Grids: stats en `auto-fill minmax(200px, 1fr)` con gap 1rem; formularios en grid de 2 columnas (`form-row`, `modal-grid`) que colapsan a 1 columna.
- Breakpoints observados: 480px (auth), 540px (form-grid), 640px (modal → bottom-sheet), 720px (nav de cliente se oculta), 900px (dashboard 2→1 col), 960px (grid del cliente 2→1).
- Ritmo de espaciado: xs .25rem · sm .5rem · md 1rem · lg 1.5rem (padding estándar de card y modal) · xl 2rem. Gaps internos .35–.5rem; padding de inputs .65rem/.875rem; botones .6rem/1.25rem.
- En móvil los modales se convierten en bottom-sheet: radius 16px 16px 0 0, `align-items: flex-end`, max-height 90vh.

## Elevation & Depth

Sistema plano por defecto: la profundidad se comunica con bordes de 1px y contraste tonal, no con sombra en reposo. La elevación aparece solo en interacción: hover de cards (translateY(-2/-3px) + sombra media), foco de inputs (halo de 3px índigo translúcido), modales (sombra grande) y glass en topbars.

### Shadow Vocabulary
- **--shadow-sm** (`0 1px 2px rgba(0,0,0,0.4)` oscuro / `0 1px 2px rgba(15,23,42,0.06)` claro): detalles mínimos.
- **--shadow-md** (`0 4px 12px rgba(0,0,0,0.4)` / `0 4px 14px rgba(15,23,42,0.1)`): hover de cards.
- **--shadow-lg** (`0 12px 40px rgba(0,0,0,0.5)` / `0 12px 40px rgba(15,23,42,0.16)`): modales y card de auth.

### Named Rules
**The Flat-At-Rest Rule.** Superficies planas en reposo. Las sombras aparecen solo como respuesta a un estado (hover, foco, modal). Un card en reposo jamás flota.

**The Glass-Only Rule.** `backdrop-filter` + transparencia solo en topbars sticky (blur 16px, `--glass-bg` 0.85) y en la card de auth (blur 20px). Fuera de ahí no hay cristal.

## Shapes

Lenguaje de esquinas: radios suaves pero decididos, y pills para todo lo que sea estado o micro-etiqueta.

- Tokens de radio: sm 6px · md 10px · lg 14px · xl 20px.
- Radios efectivos por componente: botones 8px, cards 12px, plan-options y tabs 10px, KPI 14px, modales 16px, card de auth 20px, pills 999px, avatares 50%.
- **Radius Gap observado**: los tokens declaran 6/10/14/20 pero los componentes usan 8/12/16. Los valores efectivos de componentes son los normativos para nuevo código; los tokens deberían ampliarse a 8/12/16 en una limpieza.

### Named Rules
**The Status-Pill Rule.** Todo estado (préstamo, solicitud, pago, stock, usuario) es una pill 999px con fondo translúcido semántico. Nunca un bloque sólido ni un cuadrado.

## Components

### Buttons
- **Shape:** radius 8px; padding .6rem 1.25rem; font 0.875rem/500; inline-flex con gap .5rem. Sin regla de foco propia (outline nativo).
- **Primary (.btn-primary):** fondo Índigo Comercial, texto blanco. **Hover:** Índigo Comercial claro, translateY(-1px). **Active:** translateY(0).
- **Secondary (.btn-secondary):** fondo Superficie, texto Principal, borde 1px. **Hover:** fondo Hover.
- **Ghost (.btn-ghost):** transparente, texto Secundario, borde 1px. **Hover:** fondo Hover, texto Principal.
- **Danger (.btn-danger):** fondo rojo translúcido (0.15), texto #f87171, borde rojo (0.3). **Hover:** 0.25.
- **Secondary-danger:** transparente, texto rojo, borde rojo (0.3). **Hover:** fondo rojo 0.15.
- **Disabled:** opacity 0.4–0.6 + cursor not-allowed (por contexto, no hay regla global).

### Badges / Chips
- **Style:** pill 999px, padding .2rem .65rem, font .75rem/600, letter-spacing .03em.
- **Estado:** fondo translúcido semántico + texto del tono (ver Colors). Variantes: success, warning, danger, info, muted, accent.

### Cards / Containers
- **Corner Style:** radius 12px.
- **Background:** Tarjeta (#20232e); borde 1px Borde.
- **Shadow Strategy:** solo en hover (ver Elevation).
- **Internal Padding:** 1.5rem; 0 con `overflow: hidden` cuando contiene tabla. Barras de filtro: padding 1rem + margin-bottom 1rem.

### Inputs / Fields
- **Style:** fondo Superficie, borde 1px Borde, radius 8px, padding .65rem .875rem, font .875rem, width 100%.
- **Focus:** borde acento + `box-shadow 0 0 0 3px` acento translúcido (0.12).
- **Placeholder:** Texto Apagado.
- **Error:** texto `.form-error` bajo el campo (0.75rem, rojo); el campo en sí no cambia de borde.
- **Con icono:** padding-left 2.5rem con icono absoluto en Texto Apagado; toggle de contraseña absoluto a la derecha.
- Checkbox/radio nativos sin customizar, salvo el selector de plan (radio custom: círculo 20px + punto 10px acento).

### Navigation
- **Admin sidebar:** colapsable 72→240px al hover; nav-item padding 12px 16px, icono 20px; **active:** fondo acento translúcido + texto acento claro. Topbar 60px sobre Superficie con toggle de tema y notificación (36×36, radius 8).
- **Cliente:** topbar sticky glass (blur 16px) max-width 1280px; nav-items como pills radius 8 con active acento translúcido; oculta la nav ≤720px. Botones 38×38 radius 10.
- **Tienda:** top-nav sticky glass; enlaces .85rem/500 en Texto Apagado, hover acento; CTA `.nav-cta` sólido acento.
- **Logo (tres superficies):** icono de capas con gradiente de marca (stroke #818cf8); texto FinanCrece con "Crece" en acento claro. En auth usa 44px y "LoanMS".

### Modals
- **Overlay:** fixed inset-0, z-index 1000, fondo `--overlay` (0.7 oscuro / 0.5 claro) + blur 4px, animación fadeIn .2s.
- **Content:** fondo `--modal-bg`, borde `--modal-border`, radius 16px, sombra grande, animación modalIn .22s (translateY 16px scale .98 → 1), max-height calc(100vh - 3rem) con scroll interno.
- **Sizes:** sm 420px · md 560px (default) · lg 700px · xl 900px.
- **Header:** padding 1.5rem / bottom .75rem, borde inferior; título 1.15rem/700; close-btn absoluto top/right .9rem.
- **Footer (.modal-actions):** flex-end, gap .6rem, margin-top 1.5rem.
- **Móvil:** bottom-sheet (radius 16px 16px 0 0, max-height 90vh).

### Tables
- **Headers:** padding .75rem 1rem, uppercase .75rem/600, letter-spacing .06em, Texto Apagado, borde inferior.
- **Filas:** border-bottom 1px; **hover:** fondo Hover (transition .15s).
- **Celdas:** padding .875rem 1rem, .875rem, Texto Secundario; la primera celda Texto Principal / 500.
- Avatares de fila: 32px, gradiente de marca, iniciales .75rem/700 blancas.

### Signature: Product Card + Carousel
- **Product card:** imagen 220px con carrusel (slides con fade/scale .6s, zoom 1.08 al hover), pill de stock sobre la imagen, body padding 1rem con brand uppercase .7rem/.08em, título .9rem/600, precio 1.15rem/700 en acento claro + cuota estimada .72rem, pills de plan, CTA 100% + botón de vista. Hover: translateY(-3px) + sombra media + borde acento.

### Signature: Plan Option + Estimate Panel
- **Plan option:** tarjetita sobre Superficie, borde 2px Borde, radius 10, padding 1rem; **selected:** borde acento + fondo acento translúcido + punto del radio acento visible.
- **Estimate panel (.estimate):** fondo acento translúcido + borde acento 1px, radius 12, padding 1rem 1.15rem; totales separados por border-top acento, el total en 1.1rem/700 acento claro.

### Signature: Stat / KPI Cards
- **Admin stat-card:** radius 12, padding 1.25rem, barra superior de 3px en color propio por card; icono 40×40 radius 10 con fondo `color+22`; valor 1.6rem/700.
- **Cliente kpi-card:** horizontal (icono 42×42 radius 12 + texto), radius 14, padding 1.1rem 1.25rem; valor 1.25rem/700; hover translateY(-2px) + borde acento.

## Do's and Don'ts

### Do:
- **Do** usar las variables CSS de `src/styles.css` (`--accent`, `--bg-card`, `--border`, `--radius-*`, `--shadow-*`) antes que valores hardcodeados.
- **Do** mantener el oscuro como tema por defecto y derivar el claro con `data-theme='light'` en `<html>`.
- **Do** reservar el Índigo Comercial para acción, montos y marca (The Índigo Rarity Rule).
- **Do** expresar estados como pills semánticas y encabezados de sección en uppercase.
- **Do** usar el gradiente de marca solo en logo, avatares e iconos de marca.
- **Do** elevar en hover con translateY(-1/-3px) + `--shadow-md`, y dar foco con halo de 3px `--accent-light`.
- **Do** usar glass (blur) solo en topbars sticky y card de auth.
- **Do** mantener la arquitectura: clases custom en `styles.css` + CSS por componente, sin utilidades Tailwind en templates.

### Don't:
- **Don't** añadir sombras a superficies en reposo (The Flat-At-Rest Rule).
- **Don't** usar gradientes decorativos fuera de la marca, ni fondos de color sólido para estados.
- **Don't** añadir nuevas familias de fuentes: Inter es la única.
- **Don't** agravar el Radius Gap: si introduces un radio nuevo, usa los tokens o los valores efectivos (8/12/16).
- **Don't** duplicar patrones entre componentes sin abstraerlos (`.action-btn`, `.table-avatar`, `.btn-ghost` ya se repiten).
- **Don't** usar estética de plantilla: sombras genéricas (`0 8px 24px`), emoji, iconos stock o efectos sin función.
