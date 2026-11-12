create table if not exists public.call_signals (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null default auth.uid(),
  to_id uuid not null,
  call_id text not null,
  kind text not null,
  payload text,
  created_at timestamptz not null default now()
);
alter table public.call_signals enable row level security;
drop policy if exists cs_sel on public.call_signals;
create policy cs_sel on public.call_signals for select to authenticated using (to_id = auth.uid() or from_id = auth.uid());
drop policy if exists cs_ins on public.call_signals;
create policy cs_ins on public.call_signals for insert to authenticated with check (from_id = auth.uid() and public.are_friends(auth.uid(), to_id));
drop policy if exists cs_del on public.call_signals;
create policy cs_del on public.call_signals for delete to authenticated using (from_id = auth.uid() or to_id = auth.uid());
create index if not exists cs_to on public.call_signals (to_id, created_at);
