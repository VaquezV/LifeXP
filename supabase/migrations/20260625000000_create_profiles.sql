create table if not exists profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  wolf_name  text not null default 'Loup Sans Nom',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

drop policy if exists "Users can read own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;

create policy "Users can read own profile"
  on profiles for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on profiles for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on profiles for update to authenticated
  using (auth.uid() = user_id);
