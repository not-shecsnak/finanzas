-- Endurecimiento del esquema (auditoría PR-7: M2 y M5). Incremental e idempotente.
-- La migración 20261001000000 ya está aplicada: no se edita.

-- M2: transactions.kind debe coincidir con categories.kind.
-- 1) Clave única que permite la FK compuesta (id, user_id, kind).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.categories'::regclass and conname = 'categories_id_user_id_kind_key'
  ) then
    alter table public.categories
      add constraint categories_id_user_id_kind_key unique (id, user_id, kind);
  end if;
end $$;

-- 2) Sustituye la FK (category_id, user_id) por (category_id, user_id, kind).
--    Se descubre el nombre de la FK antigua en el catálogo (solo la de 2 columnas hacia categories).
--    Comportamiento ON DELETE: el mismo que antes (NO ACTION, el valor por defecto).
do $$
declare
  old_fk text;
begin
  for old_fk in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.transactions'::regclass
      and c.contype = 'f'
      and c.confrelid = 'public.categories'::regclass
      and array_length(c.conkey, 1) = 2
  loop
    execute format('alter table public.transactions drop constraint %I', old_fk);
  end loop;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.transactions'::regclass and conname = 'transactions_category_kind_fkey'
  ) then
    alter table public.transactions
      add constraint transactions_category_kind_fkey
      foreign key (category_id, user_id, kind)
      references public.categories (id, user_id, kind);
  end if;
end $$;

-- M5: privilegios mínimos. Supabase concede ALL por defecto a authenticated
-- (incluye TRUNCATE, REFERENCES, TRIGGER, que RLS no limita; TRUNCATE ignora RLS).
revoke all on public.categories, public.transactions, public.credit_cards, public.card_balances
  from authenticated;
grant select, insert, update, delete
  on public.categories, public.transactions, public.credit_cards, public.card_balances
  to authenticated;
revoke all on public.categories, public.transactions, public.credit_cards, public.card_balances
  from anon;

-- M5: índices de FK que faltaban.
create index if not exists transactions_category_user_idx on public.transactions (category_id, user_id);
create index if not exists credit_cards_user_idx          on public.credit_cards (user_id);
create index if not exists card_balances_user_idx         on public.card_balances (user_id);
