---
issue: PR-6
parent: PR-2
agente: agent-developer
fecha: 2026-10-13
estado: in-review
---
# PR-6 — Pantalla de crédito

Feature: [[PR-2]] · Rama `feat/PR-6-pantalla-credito` (sin push ni PR verificados desde esta sesión) · apilada sobre [[PR-5]]. Integrada con [[PR-7]], [[PR-8]] y PR-10 en `tmp/integracion` para verificar que conviven.

## Qué se hizo
- `57b0b4a feat: logica de utilizacion, proxima fecha de pago y validacion de tarjetas`: `src/lib/credit.ts` (utilización = saldo / cupo, próxima fecha de pago) y `src/lib/credit-schema.ts` (Zod de tarjeta y saldo), con tests.
- `c2f910f feat: consultas y acciones de servidor para tarjetas y saldos`: `saveCard` y `saveBalance` (upsert por `card_id, month`) exigen una fila afectada; consultas en `src/lib/queries.ts`.
- `72d3c53 feat: pantalla de credito con utilizacion, proximo pago y enlace en Nav`: `/credito` y `/credito/nueva`, `card-form` y `balance-form`.

## Decisiones
- Cupos y saldos en centavos enteros, igual que los movimientos (ver `docs/adr/0002-montos-en-centavos-y-rls.md`); las tablas `credit_cards` y `card_balances` vienen del esquema de [[PR-3]].

## Verificación
- La integración `tmp/integracion` (PR-6 + PR-7 + PR-8 + PR-10) pasó 78 tests, lint y `next build`, según el reporte previo de esta sesión; no se re-ejecutó contra un Supabase real.
- Los tests de las acciones `saveCard`/`saveBalance` se añaden en la rama `test/PR-7-e2e-ci` ([[PR-7]]).

## Pendientes
- Probar la pantalla con una base real con las migraciones aplicadas (ver `docs/DEPLOY.md`).
- Finalizar con `/close-issue PR-6` tras el merge.
