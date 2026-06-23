create table if not exists public.category_momentum (
  user_id           uuid not null references auth.users(id) on delete cascade,
  momentum_selfcare float not null default 0,
  momentum_devperso float not null default 0,
  momentum_famille  float not null default 0,
  momentum_pro      float not null default 0,
  trend_selfcare    text  not null default 'stable'
    check (trend_selfcare    in ('up', 'down', 'stable')),
  trend_devperso    text  not null default 'stable'
    check (trend_devperso    in ('up', 'down', 'stable')),
  trend_famille     text  not null default 'stable'
    check (trend_famille     in ('up', 'down', 'stable')),
  trend_pro         text  not null default 'stable'
    check (trend_pro         in ('up', 'down', 'stable')),
  last_updated      date  not null default current_date,
  created_at        timestamptz not null default now(),
  constraint category_momentum_pkey primary key (user_id)
);

alter table public.category_momentum enable row level security;

-- authenticated users read/write their own row
drop policy if exists category_momentum_select on public.category_momentum;
create policy category_momentum_select on public.category_momentum
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists category_momentum_insert on public.category_momentum;
create policy category_momentum_insert on public.category_momentum
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists category_momentum_update on public.category_momentum;
create policy category_momentum_update on public.category_momentum
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists category_momentum_delete on public.category_momentum;
create policy category_momentum_delete on public.category_momentum
  for delete to authenticated using (auth.uid() = user_id);

-- edge function (service_role) can update any row
drop policy if exists category_momentum_service_all on public.category_momentum;
create policy category_momentum_service_all on public.category_momentum
  for all to service_role using (true) with check (true);
