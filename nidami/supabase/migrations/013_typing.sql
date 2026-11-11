-- « est en train d'écrire » : un petit signal éphémère entre deux amis.
create table if not exists public.typing (
  user_id uuid not null references public.profiles on delete cascade,
  to_id uuid not null references public.profiles on delete cascade,
  at timestamptz not null default now(),
  primary key (user_id, to_id)
);
alter table public.typing enable row level security;
drop policy if exists "typing: lire" on public.typing;
create policy "typing: lire" on public.typing for select to authenticated using (to_id = auth.uid() or user_id = auth.uid());
drop policy if exists "typing: écrire" on public.typing;
create policy "typing: écrire" on public.typing for insert to authenticated with check (user_id = auth.uid() and public.are_friends(auth.uid(), to_id));
drop policy if exists "typing: mettre à jour" on public.typing;
create policy "typing: mettre à jour" on public.typing for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
