# ADR 0003 — Categoría como chips (radios nativos) y validación compartida cliente/servidor

Estado: aceptada · Fecha: 2026-10-13 · Ticket: [[PR-5]]

## Contexto
Registrar un gasto desde Inicio tomaba 4 toques (+, enfocar monto, abrir el `<select>` y elegir, Guardar). El uso diario es móvil y el objetivo de v1 es registrar rápido. Además, los errores solo aparecían tras un viaje al servidor.

## Decisión
1. La categoría se elige con chips: `<fieldset role="radiogroup">` con un `<input type="radio" name="category_id">` por categoría, transparente pero encima del chip (el toque cae en el input real), siempre visibles y con `flex-wrap`. Se navegan con flechas por ser radios nativos con el mismo `name`. El seleccionado se distingue por relleno, borde claro y un "✓" (no solo por color). Objetivo táctil de 44 px y foco visible.
2. El monto recibe foco automático solo en alta.
3. El formulario valida en `onSubmit` con el mismo `transactionSchema` (y `cardSchema`) que la Server Action, mediante `fieldErrors` (`src/lib/form-validation.ts`). Si hay errores se llama a `preventDefault()` (React 19 no despacha la action) y se muestra el error junto al campo con `aria-invalid` y `aria-describedby`, foco al primer campo inválido. `noValidate` evita la burbuja del navegador. La Server Action sigue validando: el cliente es comodidad, no seguridad.
4. La categoría seleccionada es estado controlado de React. Tras un error del servidor React 19 resetea el formulario y los radios controlados vuelven a su atributo `checked` inicial, así que se remontan con el estado actual cuando llega un error.

## Alternativas descartadas
- Mantener el `<select>`: 2 toques solo para elegir categoría.
- Botones `role="radio"` a mano: hay que reimplementar flechas y foco; los radios nativos lo dan gratis.
- Validar solo en el servidor: más lento y sin mensaje por campo.

## Consecuencias
- Gasto de hoy = 3 toques; ingreso = 4 (hay que cambiar de tipo). Medido en E2E.
- Con muchas categorías los chips ocupan más pantalla (hoy hay 8 sembradas; 5-6 por tipo).
- Los mensajes de error son los del esquema: cualquier cambio de regla se hace en un solo lugar.
- No verificado: apertura del teclado por el foco automático en iOS Safari / dispositivos reales.
