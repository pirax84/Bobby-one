-- NOTIIF : notifications sur l'ordinateur même navigateur fermé (Web Push).
-- À coller une seule fois dans Supabase > SQL Editor > Run (après avoir créé la fonction « notiif-web »).

-- Abonnements des navigateurs (un par ordinateur / navigateur).
create table if not exists public.web_push_subs (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  sub jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists web_push_subs_user on public.web_push_subs(user_id);
alter table public.web_push_subs enable row level security;
drop policy if exists "web push: les miens" on public.web_push_subs;
create policy "web push: les miens" on public.web_push_subs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Clés et code secret : lisibles seulement par le serveur lui-même (aucune règle = aucun accès depuis l'appli).
create table if not exists public.web_push_keys (id int primary key, public_key text not null, private_key text not null);
alter table public.web_push_keys enable row level security;
create table if not exists public.notiif_secret (id int primary key, value text not null);
alter table public.notiif_secret enable row level security;
insert into public.notiif_secret (id, value) values (1, encode(gen_random_bytes(24), 'hex')) on conflict (id) do nothing;

-- À chaque nouveau message : on prévient la fonction « notiif-web ».
create or replace function public.notify_web_push() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare s text;
begin
  select value into s from public.notiif_secret where id = 1;
  begin
    perform net.http_post(
      url := 'https://jtymrohpjhiukjreqewb.supabase.co/functions/v1/notiif-web',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-notiif-secret', s),
      body := jsonb_build_object('group', tg_table_name = 'group_messages', 'record', jsonb_build_object(
        'id', new.id, 'sender', new.sender,
        'recipient', case when tg_table_name = 'messages' then to_jsonb(new) ->> 'recipient' end,
        'group_id', case when tg_table_name = 'group_messages' then to_jsonb(new) ->> 'group_id' end,
        'fx', new.fx, 'media_kind', new.media_kind))
    );
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists web_push_on_message on public.messages;
create trigger web_push_on_message after insert on public.messages for each row execute function public.notify_web_push();
drop trigger if exists web_push_on_group_message on public.group_messages;
create trigger web_push_on_group_message after insert on public.group_messages for each row execute function public.notify_web_push();
