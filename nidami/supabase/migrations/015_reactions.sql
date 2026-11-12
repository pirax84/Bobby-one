-- Réactions (❤️ 😂 …) sur les messages
create table if not exists public.msg_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  emoji text not null,
  at timestamptz not null default now(),
  primary key (message_id, user_id)
);
alter table public.msg_reactions enable row level security;
create policy rx_sel on public.msg_reactions for select using (exists (select 1 from public.messages m where m.id = msg_reactions.message_id and (m.sender = auth.uid() or m.recipient = auth.uid())));
create policy rx_ins on public.msg_reactions for insert with check (user_id = auth.uid() and exists (select 1 from public.messages m where m.id = msg_reactions.message_id and (m.sender = auth.uid() or m.recipient = auth.uid())));
create policy rx_upd on public.msg_reactions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy rx_del on public.msg_reactions for delete using (user_id = auth.uid());
