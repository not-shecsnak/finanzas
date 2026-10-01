-- Verifica el aislamiento por usuario (RLS). Ejecutar en el SQL Editor de Supabase
-- o con `psql` contra una base de PRUEBAS. Todo corre en una transacción que se revierte.
-- Resultado esperado: cada NOTICE termina en OK; si algo falla lanza una excepción.
begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@test.local');

-- Actuar como el usuario A.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);

do $$
declare
  cat_a uuid;
  seen int;
begin
  select id into cat_a from public.categories where kind = 'expense' limit 1;
  if cat_a is null then raise exception 'FALLO: no se sembraron categorías para A'; end if;

  insert into public.transactions (category_id, kind, amount_cents, occurred_on)
  values (cat_a, 'expense', 12345, current_date);

  select count(*) into seen from public.transactions;
  if seen <> 1 then raise exception 'FALLO: A debería ver 1 movimiento, ve %', seen; end if;
  raise notice 'A ve su movimiento: OK';
end $$;

-- Actuar como el usuario B: no debe ver nada de A.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b2', true);

do $$
declare
  seen int;
  cat_a uuid;
begin
  select count(*) into seen from public.transactions;
  if seen <> 0 then raise exception 'FALLO: B ve % movimientos de A', seen; end if;
  raise notice 'B no ve movimientos de A: OK';

  select count(*) into seen from public.categories where user_id = '00000000-0000-0000-0000-0000000000a1';
  if seen <> 0 then raise exception 'FALLO: B ve categorías de A'; end if;
  raise notice 'B no ve categorías de A: OK';

  -- B no puede usar una categoría de A.
  select id into cat_a from public.categories limit 1; -- categoría propia de B
  begin
    insert into public.transactions (user_id, category_id, kind, amount_cents, occurred_on)
    values ('00000000-0000-0000-0000-0000000000a1', cat_a, 'expense', 1, current_date);
    raise exception 'FALLO: B insertó una fila a nombre de A';
  exception when insufficient_privilege or check_violation or foreign_key_violation then
    raise notice 'B no puede insertar a nombre de A: OK';
  end;
end $$;

-- Montos inválidos rechazados.
do $$
begin
  begin
    insert into public.transactions (category_id, kind, amount_cents, occurred_on)
    select id, 'expense', 0, current_date from public.categories limit 1;
    raise exception 'FALLO: se aceptó un monto 0';
  exception when check_violation then
    raise notice 'Monto 0 rechazado: OK';
  end;
end $$;

rollback;
