# ADR 0002 — Montos en centavos enteros y aislamiento por RLS

Estado: aceptada (pendiente de mergear PR #3) · Fecha: 2026-10-01 · Tickets: [[PR-3]], [[PR-5]]

## Contexto
La app maneja dinero personal en COP y datos privados de cada usuario, con la anon key de Supabase expuesta al navegador.

## Decisión
1. Dinero como enteros en centavos: columnas `bigint` (`amount_cents`, `limit_cents`, `balance_cents`) con `check > 0`/`>= 0`, y en código `parseToCents`/`formatCents` sin float. Máximo 99.999.999.999 centavos. La interfaz muestra pesos (`es-CO`, `COP`) y acepta entrada a la colombiana.
2. Todas las tablas llevan `user_id` (default `auth.uid()`) y RLS con política `for all to authenticated` (`(select auth.uid()) = user_id`); sin acceso `anon`.
3. FKs compuestas `(id, user_id)` para impedir que una fila apunte a datos de otro usuario.
4. Categorías base sembradas por un trigger `security definer` con `search_path` vacío al crear el usuario.

## Alternativas descartadas
- `numeric`/`decimal`: válido, pero obliga a cuidar el parseo en JS; los enteros hacen la suma exacta.
- Autorizar solo en el código de la app: un fallo ahí expondría datos; RLS protege aunque la app falle.

## Consecuencias
- Sumas exactas sin errores de redondeo; hay que convertir en los bordes (formulario y vista).
- Aislamiento garantizado en la base; cada tabla nueva debe llevar `user_id` + RLS.
- COP casi nunca usa centavos, pero se guardan x100 aunque se muestren enteros.
- No verificado: `supabase/tests/rls_check.sql` existe pero no se ha ejecutado contra una base real.
