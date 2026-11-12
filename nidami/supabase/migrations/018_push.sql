-- Adresses de notification (Firebase) des téléphones : permet de prévenir application fermée.
create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists push_tokens_user on public.push_tokens(user_id);
alter table public.push_tokens enable row level security;
drop policy if exists "push: les miens" on public.push_tokens;
create policy "push: les miens" on public.push_tokens for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
