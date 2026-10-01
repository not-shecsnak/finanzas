-- Prueba de aislamiento y endurecimiento (RLS, FK compuesta, privilegios). Cubre y amplia rls_check.sql.
-- Requiere aplicadas las migraciones 20261001000000 y 20261002000000.
-- Ejecutar en el SQL Editor de Supabase (con un rol que pueda hacer SET ROLE, p. ej. postgres) o con
-- `psql -v ON_ERROR_STOP=1 -f` contra una base de PRUEBAS. Todo corre en una transaccion que se revierte.
-- Cada caso emite NOTICE '... OK' o lanza una excepcion (con ON_ERROR_STOP=1 psql sale con codigo != 0).
--
-- Sobre auth.uid(): en Supabase actual el JWT llega en el GUC `request.jwt.claims` (JSON); el GUC
-- antiguo `request.jwt.claim.sub` esta obsoleto. auth.uid() real hace:
--   coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
--            (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid
-- Aqui se usa el formato nuevo (`request.jwt.claims`). NO verificado contra la auth.uid() de TU proyecto:
-- si en el SQL Editor todos los casos de A fallan con "no se sembraron/0 categorias", revisa esa funcion.
begin;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@test.local');

-- ===== Usuario A =====
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

do $$
declare
  cat_exp uuid; cat_inc uuid; seen int; tx uuid; card uuid;
begin
  select count(*) into seen from public.categories;
  if seen <> 8 then raise exception 'FALLO: el trigger debia sembrar 8 categorias, hay %', seen; end if;
  raise notice 'Trigger siembra 8 categorias: OK';

  select id into cat_exp from public.categories where kind = 'expense' limit 1;
  select id into cat_inc from public.categories where kind = 'income' limit 1;

  insert into public.transactions (category_id, kind, amount_cents, occurred_on)
  values (cat_exp, 'expense', 12345, current_date) returning id into tx;
  select count(*) into seen from public.transactions;
  if seen <> 1 then raise exception 'FALLO: A deberia ver 1 movimiento, ve %', seen; end if;
  raise notice 'A ve su movimiento: OK';

  -- Incoherencia de kind: ingreso con categoria de gasto.
  begin
    insert into public.transactions (category_id, kind, amount_cents, occurred_on)
    values (cat_exp, 'income', 100, current_date);
    raise exception 'FALLO: se acepto un ingreso con categoria de gasto';
  exception when foreign_key_violation then
    raise notice 'Ingreso con categoria de gasto rechazado (FK): OK';
  end;
  begin
    insert into public.transactions (category_id, kind, amount_cents, occurred_on)
    values (cat_inc, 'expense', 100, current_date);
    raise exception 'FALLO: se acepto un gasto con categoria de ingreso';
  exception when foreign_key_violation then
    raise notice 'Gasto con categoria de ingreso rechazado (FK): OK';
  end;
  -- Cambiar el kind de un movimiento existente a uno incoherente tambien falla.
  begin
    update public.transactions set kind = 'income' where id = tx;
    raise exception 'FALLO: se acepto UPDATE de kind incoherente';
  exception when foreign_key_violation then
    raise notice 'UPDATE de kind incoherente rechazado: OK';
  end;

  -- Montos invalidos.
  begin
    insert into public.transactions (category_id, kind, amount_cents, occurred_on)
    values (cat_exp, 'expense', 0, current_date);
    raise exception 'FALLO: se acepto un monto 0';
  exception when check_violation then
    raise notice 'Monto 0 rechazado: OK';
  end;

  -- Tarjetas y saldos de A.
  insert into public.credit_cards (name, limit_cents, statement_day, due_day)
  values ('Tarjeta A', 100000, 5, 20) returning id into card;
  insert into public.card_balances (card_id, month, balance_cents)
  values (card, date_trunc('month', current_date)::date, 5000);
  raise notice 'A crea tarjeta y saldo: OK';

  -- Cambiar user_id en UPDATE falla (la politica WITH CHECK lo impide).
  begin
    update public.transactions set user_id = '00000000-0000-0000-0000-0000000000b2' where id = tx;
    raise exception 'FALLO: A pudo cambiar el user_id de un movimiento';
  exception when insufficient_privilege then
    raise notice 'Cambio de user_id en UPDATE rechazado: OK';
  end;

  -- Privilegios minimos: authenticated no puede TRUNCATE (RLS no lo limita).
  begin
    execute 'truncate public.transactions';
    raise exception 'FALLO: authenticated pudo hacer TRUNCATE';
  exception when insufficient_privilege then
    raise notice 'TRUNCATE denegado a authenticated: OK';
  end;

  -- Pasar IDs de A a la sesion de B.
  perform set_config('test.cat_a_exp', cat_exp::text, true);
  perform set_config('test.tx_a', tx::text, true);
  perform set_config('test.card_a', card::text, true);
end $$;

-- ===== Usuario B =====
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);

do $$
declare
  seen int; n int; cat_b uuid; card_b uuid;
  cat_a uuid := current_setting('test.cat_a_exp')::uuid;
  tx_a  uuid := current_setting('test.tx_a')::uuid;
  card_a uuid := current_setting('test.card_a')::uuid;
  a_id constant uuid := '00000000-0000-0000-0000-0000000000a1';
begin
  select count(*) into seen from public.categories;
  if seen <> 8 then raise exception 'FALLO: B deberia ver sus 8 categorias, ve %', seen; end if;
  select count(*) into seen from public.categories where user_id = a_id;
  if seen <> 0 then raise exception 'FALLO: B ve categorias de A'; end if;
  raise notice 'B solo ve sus categorias: OK';

  select count(*) into seen from public.transactions;
  if seen <> 0 then raise exception 'FALLO: B ve % movimientos de A', seen; end if;
  select count(*) into seen from public.credit_cards;
  if seen <> 0 then raise exception 'FALLO: B ve tarjetas de A'; end if;
  select count(*) into seen from public.card_balances;
  if seen <> 0 then raise exception 'FALLO: B ve saldos de A'; end if;
  raise notice 'B no ve movimientos, tarjetas ni saldos de A: OK';

  -- UPDATE / DELETE de filas ajenas afectan 0 filas.
  update public.transactions set amount_cents = 1 where id = tx_a;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: B actualizo % movimientos de A', n; end if;
  delete from public.transactions where id = tx_a;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: B borro % movimientos de A', n; end if;
  update public.credit_cards set limit_cents = 1 where id = card_a;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: B actualizo tarjetas de A'; end if;
  delete from public.credit_cards where id = card_a;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: B borro tarjetas de A'; end if;
  update public.card_balances set balance_cents = 1 where card_id = card_a;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: B actualizo saldos de A'; end if;
  delete from public.card_balances where card_id = card_a;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: B borro saldos de A'; end if;
  update public.categories set name = 'hack' where user_id = a_id;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: B actualizo categorias de A'; end if;
  delete from public.categories where user_id = a_id;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO: B borro categorias de A'; end if;
  raise notice 'UPDATE/DELETE de filas ajenas afectan 0 filas: OK';

  -- Insertar a nombre de A: lo frena la politica (insufficient_privilege).
  select id into cat_b from public.categories where kind = 'expense' limit 1;
  begin
    insert into public.transactions (user_id, category_id, kind, amount_cents, occurred_on)
    values (a_id, cat_b, 'expense', 1, current_date);
    raise exception 'FALLO: B inserto un movimiento a nombre de A';
  exception when insufficient_privilege then
    raise notice 'B no puede insertar a nombre de A (politica): OK';
  end;

  -- FK compuesta real: B inserta con SU user_id y una categoria de A -> falla por la FK, no por la politica.
  begin
    insert into public.transactions (user_id, category_id, kind, amount_cents, occurred_on)
    values ('00000000-0000-0000-0000-0000000000b2', cat_a, 'expense', 1, current_date);
    raise exception 'FALLO: B uso una categoria de A';
  exception when foreign_key_violation then
    raise notice 'FK compuesta: B no puede usar categoria de A: OK';
  end;

  -- Lo mismo con tarjetas: saldo propio sobre tarjeta ajena (mes distinto para no chocar con unique(card_id, month)).
  begin
    insert into public.card_balances (user_id, card_id, month, balance_cents)
    values ('00000000-0000-0000-0000-0000000000b2', card_a, (date_trunc('month', current_date) - interval '1 month')::date, 1);
    raise exception 'FALLO: B creo un saldo sobre una tarjeta de A';
  exception when foreign_key_violation then
    raise notice 'FK compuesta: B no puede usar tarjeta de A: OK';
  end;
  begin
    insert into public.card_balances (user_id, card_id, month, balance_cents)
    values (a_id, card_a, (date_trunc('month', current_date) - interval '1 month')::date, 1);
    raise exception 'FALLO: B inserto un saldo a nombre de A';
  exception when insufficient_privilege then
    raise notice 'B no puede insertar saldo a nombre de A: OK';
  end;

  -- Datos propios de B (se usan en la prueba de cascada).
  insert into public.transactions (category_id, kind, amount_cents, occurred_on)
  values (cat_b, 'expense', 777, current_date);
  insert into public.credit_cards (name, limit_cents, statement_day, due_day)
  values ('Tarjeta B', 50000, 1, 15) returning id into card_b;
  insert into public.card_balances (card_id, month, balance_cents)
  values (card_b, date_trunc('month', current_date)::date, 10);
  raise notice 'B opera sobre sus propios datos: OK';
end $$;

-- ===== Rol anon: sin acceso =====
set local role anon;
do $$
begin
  begin
    perform 1 from public.transactions limit 1;
    raise exception 'FALLO: anon pudo leer transactions';
  exception when insufficient_privilege then
    raise notice 'anon sin acceso a transactions: OK';
  end;
  begin
    perform 1 from public.categories limit 1;
    raise exception 'FALLO: anon pudo leer categories';
  exception when insufficient_privilege then
    raise notice 'anon sin acceso a categories: OK';
  end;
  begin
    perform 1 from public.credit_cards limit 1;
    raise exception 'FALLO: anon pudo leer credit_cards';
  exception when insufficient_privilege then
    raise notice 'anon sin acceso a credit_cards: OK';
  end;
  begin
    perform 1 from public.card_balances limit 1;
    raise exception 'FALLO: anon pudo leer card_balances';
  exception when insufficient_privilege then
    raise notice 'anon sin acceso a card_balances: OK';
  end;
  begin
    insert into public.categories (user_id, name, kind) values ('00000000-0000-0000-0000-0000000000a1', 'x', 'expense');
    raise exception 'FALLO: anon pudo insertar';
  exception when insufficient_privilege then
    raise notice 'anon no puede insertar: OK';
  end;
end $$;

-- ===== Cascada al borrar el usuario (rol privilegiado) =====
reset role;
do $$
declare
  b_id constant uuid := '00000000-0000-0000-0000-0000000000b2';
  c int; t int; k int; bal int; a_left int;
begin
  select count(*) into c from public.categories   where user_id = b_id;
  select count(*) into t from public.transactions where user_id = b_id;
  select count(*) into k from public.credit_cards where user_id = b_id;
  if c = 0 or t = 0 or k = 0 then raise exception 'FALLO: precondicion, B deberia tener datos'; end if;

  delete from auth.users where id = b_id;

  select count(*) into c   from public.categories    where user_id = b_id;
  select count(*) into t   from public.transactions  where user_id = b_id;
  select count(*) into k   from public.credit_cards  where user_id = b_id;
  select count(*) into bal from public.card_balances where user_id = b_id;
  if c + t + k + bal <> 0 then
    raise exception 'FALLO: quedaron datos de B tras borrarlo (cat %, tx %, cards %, bal %)', c, t, k, bal;
  end if;
  select count(*) into a_left from public.categories where user_id = '00000000-0000-0000-0000-0000000000a1';
  if a_left <> 8 then raise exception 'FALLO: la cascada afecto a A'; end if;
  raise notice 'Borrar usuario borra en cascada sus datos y no toca a A: OK';
end $$;

rollback;
