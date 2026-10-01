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
- El mensaje del commit lo dice: el script de RLS está "sin ejecutar aún". No se ha aplicado la migración ni corrido `rls_check.sql` contra una base real (no verificado).

## Pendientes
- Aplicar la migración en el proyecto Supabase y ejecutar `rls_check.sql` (en una base de pruebas).
- `credit_cards`/`card_balances` no tienen UI hasta [[PR-6]].
- Finalizar con `/close-issue PR-3` tras el merge.
