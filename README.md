# Finanzas

App web personal para ordenar ingresos y gastos (pensada para un joven de 20 años que quiere construir historial crediticio). Mobile-first, tema morado oscuro, interfaz en español y moneda COP. Cada usuario ve únicamente sus datos.

Estado (v1): login, movimientos (crear, editar, eliminar, filtrar por mes y categoría) y resumen mensual. Incluye también la pantalla de crédito (PR-6), Docker/CI (PR-8), pruebas y E2E (PR-7). Despliegue paso a paso en [docs/DEPLOY.md](docs/DEPLOY.md).

## Stack

Next.js 16 (App Router, `src/proxy.ts`) · React 19 · Tailwind 4 · Supabase (Auth + Postgres con RLS) · Zod · Vitest · Vercel. Ver [ADR 0001](docs/adr/0001-stack.md).

## Correrla en 3 comandos

```bash
git clone https://github.com/not-shecsnak/finanzas.git && cd finanzas
cp .env.example .env     # completa las variables (abajo)
npm install && npm run dev
```

Variables en `.env` (nunca se commitea):

```
NEXT_PUBLIC_SUPABASE_URL=https://<id>.supabase.co     # SIN /rest/v1/
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key del proyecto>
```

Nota: el `.env.example` actual solo trae las variables de Linear del flujo HDD; las dos de Supabase hay que añadirlas a mano (pendiente de actualizar la plantilla). Si pegas una ruta como `/rest/v1/`, la app la recorta al origen (`normalizeSupabaseUrl`), pero usa la URL limpia.

En Supabase, Authentication debe permitir registro con correo; si no, el formulario muestra la causa traducida.

## Migración de base de datos

Las migraciones viven en `supabase/migrations/` (`20261001000000_init_schema.sql` y `20261002000000_hardening.sql`, en ese orden). Orden y comprobaciones en [docs/DEPLOY.md](docs/DEPLOY.md). Aplícalas pegándolas en el SQL Editor de Supabase. La primera ya se aplicó en el proyecto del autor (volver a correrla da `42P07: relation "categories" already exists`, lo cual es esperado); la de endurecimiento está pendiente de aplicar allí. La CLI de Supabase solo se ha usado en local para el E2E.

Qué contiene (leído del archivo):

- `categories` (nombre 1-40, `kind` income/expense, color hex), única por `(user_id, kind, name)`.
- `transactions` (`amount_cents bigint > 0`, `occurred_on date`, nota ≤ 200), con índice `(user_id, occurred_on desc)`.
- `credit_cards` y `card_balances` (para la pantalla de crédito, PR-6; la UI aún no existe).
- `user_id` por defecto `auth.uid()` en todas las tablas; FKs compuestas `(id, user_id)` para que una fila no pueda referenciar la categoría/tarjeta de otro usuario.
- RLS activada con una política `for all to authenticated` por tabla (`auth.uid() = user_id`) y `revoke all ... from anon`.
- Trigger `on_auth_user_created_seed_categories` que siembra 8 categorías base (Sueldo, Otros ingresos, Comida, Transporte, Ocio, Estudios, Suscripciones, Otros gastos) al crear cada usuario.

`supabase/tests/rls_check.sql` (misma rama) comprueba el aislamiento entre dos usuarios en una transacción que se revierte. Se validó en un Postgres 16.2 local con un stub mínimo del esquema `auth` (incluido un control negativo que lo hace fallar si se quita RLS); no se ha ejecutado contra el Supabase real. Ver [ADR 0002](docs/adr/0002-montos-en-centavos-y-rls.md).

## Tests

```bash
npm test                # vitest run
npm run test:coverage   # con cobertura v8 (falla si baja del umbral)
```

Cubren lógica pura en `src/lib/*.test.ts`: montos, fechas, resumen, validación de movimientos y de auth, errores de auth y normalización de la URL de Supabase. No hay tests E2E ni de componentes todavía.

También hay tests de integración de las Server Actions (`movimientos`, `credito`, `login`) con un cliente Supabase simulado (`src/test/supabase-mock.ts`): sesión, validación, categoría, filas afectadas por RLS, errores de BD con mensaje genérico y centavos enviados a la base. La cobertura se mide sobre `src/lib` y las acciones; medida actual: líneas 84,22 %, sentencias 84,59 %, ramas 84,38 %, funciones 77,94 %. Umbral en `vitest.config.ts`: 79 % líneas/sentencias/ramas y 72 % funciones; el CI lo exige y sube `coverage/` como artefacto.

## Estructura

```
src/
  proxy.ts                  refresca sesión Supabase y redirige a /login
  app/
    layout.tsx, globals.css tema morado oscuro
    login/                  entrar / crear cuenta (server actions + formulario)
    (app)/                  rutas protegidas
      page.tsx              inicio: resumen del mes y gasto por categoría
      movimientos/          lista, nuevo/, [id]/ (editar), actions.ts
  components/               nav, fab, month-picker, summary-cards, transaction-form
  lib/
    money.ts                centavos <-> texto COP
    dates.ts, summary.ts, queries.ts
    transaction-schema.ts, auth-schema.ts, auth-errors.ts
    config.ts, env.ts       LOCALE/CURRENCY y variables de Supabase
    supabase/               clientes server y proxy
scripts/                    flujo HDD (close_issue.sh, linear_client.py, ...)
.claude/vault/              notas por ticket
docs/adr/                   decisiones de arquitectura
```

## Montos a la colombiana

Se guardan como enteros en centavos (nunca float) y se muestran con `es-CO`/`COP` (`$ 50.000`; decimales solo si existen). Al escribir, el campo agrupa miles con punto y la coma marca decimales. Se aceptan `50000`, `50.000`, `1.500.000`, `150,50`, `1.234,56` y `1,234.56`; se rechazan formatos ambiguos como `1,234`, y el máximo es 99.999.999.999 centavos.

## E2E

Playwright + axe (WCAG 2.0/2.1/2.2 AA) contra un Supabase local en puertos propios (`55321`-`55327`, `project_id = "finanzas-e2e"`), sin tocar producción ni otros stacks locales. Requiere Docker.

```bash
npx supabase@latest start        # aplica supabase/migrations/ (usa supabase/config.toml)
eval "$(npx supabase@latest status -o env | grep -E '^(API_URL|ANON_KEY)=')"; export NEXT_PUBLIC_SUPABASE_URL="$API_URL" NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"
npx playwright install chromium && npm run test:e2e   # construye y sirve la app en :3100
npx supabase@latest stop --no-backup
```

Las claves salen del entorno del shell, no de archivos. Con `E2E_BASE_URL` se usa un servidor ya levantado. En CI corre `.github/workflows/e2e.yml`.

## Flujo de trabajo (HDD)

Linear (tickets `PR-N`) + GitHub (código) + gates mecánicos. Detalle en `CLAUDE.md`.

1. `/plan-feature` crea el padre y los sub-issues; `/start-issue PR-N` crea la rama `feat/PR-N-slug` (o `fix/`, `chore/`, `docs/`) antes de tocar código.
2. Commits Conventional Commits en español, terminando con `Refs PR-N` (nunca `Closes/Fixes/Resolves`: el hook `commit-msg` lo bloquea). Gitleaks corre en pre-commit y en CI. Nunca `--no-verify`, nunca commit directo a `main`.
3. PR contra `main`; push, PRs y cambios en Linear requieren autorización explícita.
4. `/close-issue PR-N` corre tres gates (tests, CI, criterios `- [ ]`) y mueve el ticket a Done; `/close-feature` cierra el padre.

### Cuándo se escribe cada nota

Causa raíz (PR-10): `scripts/close_issue.sh` solo crea la nota `.claude/vault/PR-N.md` al cerrar el issue, y mientras el trabajo estaba en curso no se documentó nada, así que el vault y el README quedaron vacíos. Regla desde ahora:

- La nota de vault se escribe al abrir la PR, con `estado: in-review`: qué se hizo, decisiones, verificación real y pendientes.
- Se finaliza al cerrar con `/close-issue`: el script, si la nota ya existe, no la sobrescribe y añade un bloque `## Cierre` con gates, intentos, agente y PR. Entonces el estado pasa a `done`.
- Cambios que afecten cómo correr o configurar la app actualizan este README en la misma PR.
- Decisiones difíciles de revertir van como ADR en `docs/adr/`.
