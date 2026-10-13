# Despliegue: Supabase + Vercel

Procedimiento para publicar Finanzas v1 (tickets PR-8 y PR-2). Requiere tu cuenta de Supabase, tu cuenta de Vercel y el repo `not-shecsnak/finanzas`. Nada de esto se ha ejecutado contra un proyecto real: cada paso trae su comprobación para que lo verifiques tú.

Los nombres de menú de Supabase y Vercel están escritos de memoria y pueden haber cambiado; las SQL y variables sí salen del repo.

Orden: 1) Supabase (esquema) -> 2) Vercel (variables y build) -> 3) Supabase (URLs de redirección) -> 4) crear tu cuenta -> 5) cerrar el registro.

## 1. Supabase: base de datos

1. Crea el proyecto en Supabase (o usa el existente) y abre **SQL Editor**.
2. Comprobación previa (proyecto sin el esquema; debe devolver 0 filas):

   ```sql
   select table_name from information_schema.tables
   where table_schema = 'public'
     and table_name in ('categories', 'transactions', 'credit_cards', 'card_balances');
   ```

   Si devuelve filas, el esquema ya está aplicado (total o parcialmente): no pegues la migración 1 otra vez; salta a la 2 solo si la 1 está completa. La migración 1 no es idempotente; la 2 sí.
3. Aplica **en este orden**, una por ejecución, pegando el contenido completo del archivo y pulsando Run:
   1. `supabase/migrations/20261001000000_init_schema.sql`: tablas, RLS, trigger que siembra 8 categorías por usuario.
   2. `supabase/migrations/20261002000000_hardening.sql`: FK compuesta por `kind`, privilegios mínimos para `authenticated`, índices. Depende de la 1.
4. Comprobación posterior:

   ```sql
   select c.relname, c.relrowsecurity as rls
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in ('categories', 'transactions', 'credit_cards', 'card_balances');
   ```

   Las 4 filas deben mostrar `rls = true`. Opcional: pega `supabase/tests/rls_check_v2.sql` en el SQL Editor; corre en una transacción que se revierte y cada caso emite `NOTICE ... OK` o lanza una excepción. Léela antes: usa `set local role` y la función `auth.uid()` de tu proyecto (ver el comentario de su cabecera). Esa misma prueba corre en CI (`.github/workflows/rls.yml`) contra un Postgres desechable.
5. Origen de los archivos: la rama `fix/PR-7-rls-hardening` (la migración 1 también está en `feat/PR-3-esquema-supabase-rls`). Con CLI de Supabase la alternativa es `supabase db push`; no se ha probado aquí.

## 2. Vercel

1. **Add New -> Project** e importa `not-shecsnak/finanzas`. Framework: Next.js (autodetectado). Build Command e Install Command: los de por defecto (`next build`, `npm install`). No pongas Output Directory.
2. **Settings -> General -> Node.js Version: 22.x** (es la que usa el CI y la imagen Docker).
3. **Settings -> Environment Variables** (Production y Preview):

   | Nombre | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<id>.supabase.co` (solo el origen, **sin** `/rest/v1/`) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la clave `anon` / publishable de Project Settings -> API |

   Ambas se incrustan en el bundle al compilar y la URL también define la política CSP (`connect-src`): si las cambias, haz **Redeploy**, no basta con reiniciar. La anon key es pública por diseño (la seguridad la da la RLS); **nunca** pongas la `service_role` en Vercel.
4. Production Branch: `main`. Cada push a `main` despliega; las PRs generan preview.
5. Comprobación: abre `https://<tu-dominio>.vercel.app/` sin sesión; debe redirigir a `/login`. Si ves error de variables de entorno, falta o está mal alguna del paso 3.

## 3. Supabase: URLs de redirección

**Authentication -> URL Configuration**:

- **Site URL**: `https://<tu-dominio>.vercel.app` (o tu dominio propio).
- **Redirect URLs**: añade `https://<tu-dominio>.vercel.app/**`. Para previews de Vercel añade también `https://*-<tu-equipo>.vercel.app/**` si las vas a usar.

Esto importa si **Confirm email** está activo: el enlace del correo de confirmación apunta a la Site URL. Si lo dejas como `http://localhost:3000`, el enlace llevará a una página que no existe. Para uso personal puedes desactivar **Authentication -> Providers -> Email -> Confirm email** y entrar directo tras registrarte.

## 4. Crear tu cuenta

Abre `/login`, pestaña **Crear cuenta**, correo y contraseña (mínimo según el formulario). Comprueba que entras, que ves las 8 categorías al crear un gasto y que `50.000` se guarda como `$ 50.000`. Si el registro falla, el formulario muestra la causa traducida (por ejemplo, registro desactivado o límite de correos).

## 5. Cerrar el registro

Con tu cuenta creada: **Authentication -> Sign In / Providers** (o **Settings**) -> desactiva **Allow new users to sign up**. A partir de ahí nadie más puede crear cuentas; tú sigues entrando con `signInWithPassword`. Comprueba en una ventana privada que crear otra cuenta muestra el error de registro desactivado. Para dar de alta a alguien más, vuelve a activarlo temporalmente.

## Lista de verificación (criterios de PR-8 / PR-2)

- [ ] Migraciones 1 y 2 aplicadas; las 4 tablas con `rls = true`.
- [ ] Variables en Vercel sin `/rest/v1/`; Node 22.
- [ ] `/` sin sesión redirige a `/login` en la URL de Vercel.
- [ ] Site URL y Redirect URLs con el dominio de Vercel.
- [ ] Cuenta creada y registro cerrado.
- [ ] CI en verde en `main` (workflows `CI`, y los de RLS/E2E si están mergeados).

## Alternativa: Docker

`docker compose up --build` con tu `.env` (mismas dos variables) levanta la imagen de producción en el puerto 3000. Vercel no usa el Dockerfile.
