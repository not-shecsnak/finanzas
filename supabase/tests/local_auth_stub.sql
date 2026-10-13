-- SOLO para validar en un Postgres desechable (NO ejecutar en Supabase: ya existe todo esto).
-- Imita lo minimo de Supabase: esquema auth, auth.users, auth.uid(), roles y privilegios por defecto.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
create table auth.users (id uuid primary key, instance_id uuid, aud text, role text, email text);
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;
grant execute on function auth.uid() to anon, authenticated, service_role;
-- Supabase concede ALL por defecto sobre tablas nuevas de public.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
