-- supabase/migrations/20260702_add_user_palette_progression.sql

-- ── 1. Create trigger function (if not exists) ──────────────────────────────
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = current_timestamp;
  return new;
end;
$$ language plpgsql;

-- ── 2. Create user_palette_progression table ───────────────────────────────
create table if not exists public.user_palette_progression (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_wolf_level int not null default 1 check (current_wolf_level >= 1 and current_wolf_level <= 10),
  last_seen_wolf_level int not null default 1 check (last_seen_wolf_level >= 1 and last_seen_wolf_level <= 10),
  transition_date timestamptz not null default current_timestamp,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

-- Enable RLS
alter table public.user_palette_progression enable row level security;

-- ── 3. RLS Policies ────────────────────────────────────────────────────────
drop policy if exists "Users can read own palette progression" on public.user_palette_progression;
create policy "Users can read own palette progression"
  on public.user_palette_progression for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own palette progression" on public.user_palette_progression;
create policy "Users can insert own palette progression"
  on public.user_palette_progression for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own palette progression" on public.user_palette_progression;
create policy "Users can update own palette progression"
  on public.user_palette_progression for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own palette progression" on public.user_palette_progression;
create policy "Users can delete own palette progression"
  on public.user_palette_progression for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "service_role can manage palette progression" on public.user_palette_progression;
create policy "service_role can manage palette progression"
  on public.user_palette_progression for all to service_role
  using (true) with check (true);

-- ── 4. Trigger: auto-update updated_at on changes ─────────────────────────
drop trigger if exists update_palette_progression_timestamp on public.user_palette_progression;
create trigger update_palette_progression_timestamp
before update on public.user_palette_progression
for each row
execute function public.update_updated_at_column();

-- ── 5. Index for performance ───────────────────────────────────────────────
create index if not exists user_palette_progression_user_idx on public.user_palette_progression(user_id);
