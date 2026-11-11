-- NOTIIF — base du serveur, étape 1 : comptes, amis (avec catégories), messages + effets.
-- À coller dans Supabase > SQL Editor > New query > Run. Peut être relancé sans danger.

create extension if not exists pgcrypto;

-- ── Profils ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default 'Moi' check (char_length(display_name) between 1 and 30),
  code text unique not null default upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8)),
  created_at timestamptz not null default now()
);

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1), 'Moi'), 30))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ── Amis : une ligne PAR PERSONNE (chacun a ses propres catégories pour l'autre) ──
create table if not exists public.friends (
  user_id uuid not null references public.profiles on delete cascade,
  friend_id uuid not null references public.profiles on delete cascade,
  cats text[] not null default '{}',
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles on delete cascade,
  to_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  unique (from_id, to_id),
  check (from_id <> to_id)
);

-- ── Messages (un texte et/ou un effet) ───────────────────────────────────
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender uuid not null references public.profiles on delete cascade,
  recipient uuid not null references public.profiles on delete cascade,
  body text not null default '' check (char_length(body) <= 2000),
  fx text check (fx is null or char_length(fx) <= 30),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender <> recipient)
);
create index if not exists messages_pair_idx on public.messages (recipient, created_at desc);
create index if not exists messages_sender_idx on public.messages (sender, created_at desc);

-- ── Outil : sont-ils amis ? ─────────────────────────────────────────────
create or replace function public.are_friends(x uuid, y uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.friends where user_id = x and friend_id = y) $$;

-- ── Sécurité : tout fermé par défaut, on ouvre au strict nécessaire ──────
alter table public.profiles enable row level security;
alter table public.friends enable row level security;
alter table public.friend_requests enable row level security;
alter table public.messages enable row level security;

drop policy if exists "profil: moi, mes amis, mes demandes" on public.profiles;
create policy "profil: moi, mes amis, mes demandes" on public.profiles for select to authenticated using (
  id = auth.uid() or public.are_friends(auth.uid(), id)
  or exists (select 1 from public.friend_requests r where (r.from_id = id and r.to_id = auth.uid()) or (r.to_id = id and r.from_id = auth.uid()))
);
drop policy if exists "profil: je modifie le mien" on public.profiles;
create policy "profil: je modifie le mien" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "amis: les miens" on public.friends;
create policy "amis: les miens" on public.friends for select to authenticated using (user_id = auth.uid());
drop policy if exists "amis: je règle mes catégories" on public.friends;
create policy "amis: je règle mes catégories" on public.friends for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "amis: je retire un ami" on public.friends;
create policy "amis: je retire un ami" on public.friends for delete to authenticated using (user_id = auth.uid() or friend_id = auth.uid());

drop policy if exists "demandes: les miennes" on public.friend_requests;
create policy "demandes: les miennes" on public.friend_requests for select to authenticated using (auth.uid() in (from_id, to_id));
drop policy if exists "demandes: j'annule ou je refuse" on public.friend_requests;
create policy "demandes: j'annule ou je refuse" on public.friend_requests for delete to authenticated using (auth.uid() in (from_id, to_id));

drop policy if exists "messages: lire les miens" on public.messages;
create policy "messages: lire les miens" on public.messages for select to authenticated using (auth.uid() in (sender, recipient));
drop policy if exists "messages: envoyer à un ami" on public.messages;
create policy "messages: envoyer à un ami" on public.messages for insert to authenticated
  with check (sender = auth.uid() and public.are_friends(auth.uid(), recipient) and public.are_friends(recipient, auth.uid()));
drop policy if exists "messages: marquer comme lu" on public.messages;
create policy "messages: marquer comme lu" on public.messages for update to authenticated using (recipient = auth.uid()) with check (recipient = auth.uid());

-- ── Fonctions appelées par l'appli ───────────────────────────────────────
-- Trouver quelqu'un grâce à son code (on ne peut pas lister les gens)
create or replace function public.find_by_code(p_code text) returns table (id uuid, display_name text)
language sql stable security definer set search_path = public as
$$ select id, display_name from public.profiles where code = upper(trim(p_code)) and id <> auth.uid() limit 1 $$;

-- Envoyer une demande d'ami
create or replace function public.request_friend(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); other uuid;
begin
  if me is null then raise exception 'non connecté'; end if;
  select id into other from public.profiles where code = upper(trim(p_code));
  if other is null or other = me then return 'introuvable'; end if;
  if public.are_friends(me, other) then return 'deja-amis'; end if;
  -- si l'autre m'a déjà demandé, on accepte directement
  if exists (select 1 from public.friend_requests where from_id = other and to_id = me) then
    delete from public.friend_requests where from_id = other and to_id = me;
    insert into public.friends (user_id, friend_id) values (me, other), (other, me) on conflict do nothing;
    return 'ami-ajoute';
  end if;
  insert into public.friend_requests (from_id, to_id) values (me, other) on conflict do nothing;
  return 'demande-envoyee';
end $$;

-- Accepter une demande en choisissant la catégorie (mes catégories pour cette personne)
create or replace function public.accept_request(p_id uuid, p_cats text[] default '{}') returns boolean
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r public.friend_requests;
begin
  select * into r from public.friend_requests where id = p_id and to_id = me;
  if not found then return false; end if;
  delete from public.friend_requests where id = p_id;
  insert into public.friends (user_id, friend_id, cats) values (me, r.from_id, coalesce(p_cats, '{}')) on conflict (user_id, friend_id) do update set cats = excluded.cats;
  insert into public.friends (user_id, friend_id) values (r.from_id, me) on conflict do nothing;
  return true;
end $$;

revoke all on function public.find_by_code(text), public.request_friend(text), public.accept_request(uuid, text[]) from public, anon;
grant execute on function public.find_by_code(text), public.request_friend(text), public.accept_request(uuid, text[]) to authenticated;

-- ── Temps réel : les nouveaux messages arrivent tout de suite sur l'autre téléphone ──
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.friend_requests;
exception when duplicate_object then null; end $$;
