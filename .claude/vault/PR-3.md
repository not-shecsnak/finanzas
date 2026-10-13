---
issue: PR-3
parent: PR-2
agente: agent-architect
fecha: 2026-10-01
estado: in-review
pr: "#3"
---
# PR-3 — Esquema Supabase con RLS

Feature: [[PR-2]] · Rama `feat/PR-3-esquema-supabase-rls` · PR #3 abierta, sin mergear. Sale de `ed4625e` (esqueleto de [[PR-4]]), en paralelo a la rama de login.

## Qué se hizo
- `45bd31f feat: esquema Supabase con RLS por usuario`: `supabase/migrations/20261001000000_init_schema.sql` (95 líneas) y `supabase/tests/rls_check.sql` (70 líneas).
- Tablas `categories`, `transactions`, `credit_cards`, `card_balances`; índice `(user_id, occurred_on desc)`; RLS en las cuatro con política `for all to authenticated`; `revoke all ... from anon`; trigger que siembra 8 categorías base al crear un usuario.

## Decisiones
- Montos como `bigint` en centavos; FKs compuestas `(id, user_id)` contra referencias entre usuarios. Ver `docs/adr/0002-montos-en-centavos-y-rls.md`.
- Trigger `security definer` con `search_path = ''` y `revoke` de ejecución.

## Verificación
- Migración y `rls_check.sql` validados en Postgres 16.2 local (Docker) con un stub mínimo de `auth`: migración sin errores, pruebas OK y control negativo (con RLS desactivado la prueba falla: "B ve 1 movimientos de A").
- La migración ya está aplicada en el Supabase del autor (volver a correrla da `42P07 ... already exists`). El stub no es Supabase real: `rls_check.sql` no se ha ejecutado allí.
- El commit original decía "sin ejecutar aún"; quedó desactualizado.

## Pendientes
- Endurecimiento en la rama `fix/PR-7-rls-hardening` (migración `20261002000000_hardening.sql`: kind coherente, privilegios mínimos, índices), validado en local y aún sin aplicar en Supabase.
- `credit_cards`/`card_balances` no tienen UI hasta [[PR-6]].
- Finalizar con `/close-issue PR-3` tras el merge.

## Cierre — 2026-10-13T16:53:51Z
- Gates: 3/3 (intentos: 1) · Agente: agent-architect · PR: n/a
