-- Esquema inicial de Finanzas v1.
-- Montos en centavos enteros (bigint). Todas las tablas llevan user_id y RLS.

create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 40),
  kind       text not null check (kind in ('income', 'expense')),
  color      text not null default '#8b5cf6' check (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, kind, name)
);

create table public.transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id  uuid not null,
  kind         text not null check (kind in ('income', 'expense')),
  amount_cents bigint not null check (amount_cents > 0),
  occurred_on  date not null,
  note         text check (note is null or char_length(note) <= 200),
  created_at   timestamptz not null default now(),
  -- la categoría debe pertenecer al mismo usuario
  foreign key (category_id, user_id) references public.categories (id, user_id)
);

create index transactions_user_date_idx on public.transactions (user_id, occurred_on desc);

create table public.credit_cards (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 40),
  limit_cents   bigint not null check (limit_cents > 0),
  statement_day smallint not null check (statement_day between 1 and 31),
  due_day       smallint not null check (due_day between 1 and 31),
  created_at    timestamptz not null default now(),
  unique (id, user_id)
);

create table public.card_balances (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id       uuid not null,
  month         date not null check (month = date_trunc('month', month)::date),
  balance_cents bigint not null check (balance_cents >= 0),
  created_at    timestamptz not null default now(),
  unique (card_id, month),
  foreign key (card_id, user_id) references public.credit_cards (id, user_id) on delete cascade
);

-- Row Level Security: cada usuario solo ve y modifica sus filas.
alter table public.categories    enable row level security;
alter table public.transactions  enable row level security;
alter table public.credit_cards  enable row level security;
alter table public.card_balances enable row level security;

create policy categories_owner    on public.categories    for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy transactions_owner  on public.transactions  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy credit_cards_owner  on public.credit_cards  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy card_balances_owner on public.card_balances for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Sin acceso anónimo.
revoke all on public.categories, public.transactions, public.credit_cards, public.card_balances from anon;

-- Categorías base al crear la cuenta.
create function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categories (user_id, name, kind, color) values
    (new.id, 'Sueldo',        'income',  '#34d399'),
    (new.id, 'Otros ingresos','income',  '#6ee7b7'),
    (new.id, 'Comida',        'expense', '#f87171'),
    (new.id, 'Transporte',    'expense', '#fb923c'),
    (new.id, 'Ocio',          'expense', '#a78bfa'),
    (new.id, 'Estudios',      'expense', '#60a5fa'),
    (new.id, 'Suscripciones', 'expense', '#f472b6'),
    (new.id, 'Otros gastos',  'expense', '#94a3b8');
  return new;
end;
$$;

revoke all on function public.seed_default_categories() from public, anon, authenticated;

create trigger on_auth_user_created_seed_categories
  after insert on auth.users
  for each row execute function public.seed_default_categories();
