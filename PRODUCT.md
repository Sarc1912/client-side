# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Tres audiencias con peso igualitario (confirmado por el dueño):

- **Clientes-compradores**: navegan la tienda, filtran por categoría, revisan el detalle de productos (galería, especificaciones, planes) y solicitan financiamiento.
- **Clientes con préstamo activo**: ven su dashboard, consultan el calendario de cuotas y el saldo pendiente, y reportan pagos.
- **Staff / administración**: gestionan usuarios, categorías, productos, planes de financiamiento, métodos de pago; aprueban solicitudes, crean préstamos, registran pagos contra cuotas y revisan la auditoría.

## Product Purpose

Sistema web que integra compra y financiamiento a plazos para equipos y tecnología: el cliente compra en la tienda **FinanCrece** y paga en cuotas (enganche + cuotas con interés), mientras el staff opera solicitudes, préstamos y cobranza de extremo a extremo en el mismo sistema.

## Positioning

Mecanismo diferenciador observado en el código (inferido, no confirmado por el dueño): financiamiento calculado y operado dentro de la propia tienda — planes con tasa anual, enganche y cuota calculados sobre el precio del producto, más cobranza gestionada en el mismo producto (calendario de cuotas, pagos parciales, estado de mora), en lugar de derivar la deuda a un sistema separado.

## Operating Context

- SPA en Angular 22 con Tailwind CSS 4, ng-icons y backend separado (`server-side`, API en `http://localhost:3000`).
- Roles autenticados por JWT: `client` y staff/admin.
- UI actual en español.
- Flujos principales: tienda → solicitud de préstamo (selección de productos + plan con vista previa de cálculo) → aprobación admin → préstamo activo con calendario de cuotas → reporte de pagos.
- Comando de desarrollo: `ng serve` (puerto 4200); build: `ng build`.

## Capabilities and Constraints

- Tienda pública: catálogo, búsqueda, categorías, carrusel de imágenes por producto, detalle con especificaciones y planes disponibles.
- Solicitud multi-producto con selección de plan y vista previa en vivo (monto, interés, enganche, cuota, total).
- Panel admin: usuarios, categorías, productos (imágenes y especificaciones), planes, solicitudes, préstamos activos (calendario de cuotas), pagos, métodos de pago y auditoría.
- Portal cliente: dashboard y reporte de pagos contra el calendario de cuotas (enganche y cuotas, pagos parciales).
- Temas claro y oscuro con persistencia.
- Test runner: Vitest vía `ng test`; sin suite e2e configurada.

## Brand Commitments

Sin restricciones de marca confirmadas por el dueño. El nombre actual "FinanCrece" y el idioma español se conservan por defecto como estado vigente, pero no son compromisos vinculantes para trabajo futuro de diseño.

## Evidence on Hand

- Código fuente completo de la implementación: `client-side/` (Angular) y `server-side/` (API).
- Marcas visuales actuales: logo FinanCrece (pila de capas, gradiente #6366f1 → #8b5cf6).
- `README.md` es el generado por Angular CLI; no contiene información de producto.
- No hay testimonios, casos de estudio, prensa, ni datos de muestra verídicos documentados; trabajo futuro no debe fabricarlos.

## Product Principles

1. **Las tres superficies importan por igual**: la coherencia de sistema (admin, portal, tienda) vale tanto como la tienda misma.
2. **Veracidad comercial**: al ser un producto comercial en marcha, copy y datos visibles deben ser creíbles y cuidadosos.
3. **Claridad financiera**: montos, cuotas, enganche e interés siempre visibles, consistentes y legibles en todos los estados.
4. **Operación rápida**: los paneles administrativos deben ser densos, escaneables y consistentes.