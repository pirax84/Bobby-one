-- ════════════════════════════════════════════════════════════════════════════
-- Nidami — schéma PostgreSQL (Supabase). NON TESTÉ sur un vrai serveur : à exécuter
-- d'abord dans un projet de TEST, puis à valider (voir docs/GUIDE.md).
-- Principe : le navigateur ne lit JAMAIS les tables de contenu directement.
-- Tout passe par des fonctions (security definer) qui utilisent l'HEURE DU SERVEUR (now()).
-- ════════════════════════════════════════════════════════════════════════════
create extension if not exists pgcrypto;

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  bio text default '' check (char_length(bio) <= 200),
  status text default '' check (char_length(status) <= 60),
  avatar_path text,
  invite_code text unique not null default ('NID-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,5))),
  created_at timestamptz not null default now()
);
create table friendships (            -- une ligne par paire, a < b
  a uuid references profiles on delete cascade, b uuid references profiles on delete cascade,
  created_at timestamptz default now(), primary key (a, b), check (a < b)
);
create table friend_requests (
  id uuid primary key default gen_random_uuid(), from_id uuid not null references profiles on delete cascade, to_id uuid not null references profiles on delete cascade,
  created_at timestamptz default now(), unique (from_id, to_id)
);
create table blocks ( blocker uuid references profiles on delete cascade, blocked uuid references profiles on delete cascade, primary key (blocker, blocked) );
create table invitations (            -- invitations révocables et qui expirent
  id uuid primary key default gen_random_uuid(), owner uuid not null references profiles on delete cascade,
  token_hash text not null unique, expires_at timestamptz not null, revoked boolean not null default false, used_by uuid references profiles
);
create table groups ( id uuid primary key default gen_random_uuid(), name text not null, emoji text default '👥', description text default '', rules text default '', created_by uuid references profiles );
create table group_members ( group_id uuid references groups on delete cascade, user_id uuid references profiles on delete cascade, is_admin boolean default false, primary key (group_id, user_id) );
create table friend_lists ( id uuid primary key default gen_random_uuid(), owner uuid references profiles on delete cascade, name text not null );
create table friend_list_members ( list_id uuid references friend_lists on delete cascade, user_id uuid references profiles on delete cascade, primary key (list_id, user_id) );

create table posts (
  id uuid primary key default gen_random_uuid(), author uuid not null references profiles on delete cascade,
  kind text not null check (kind in ('text','photo')), body text default '' check (char_length(body) <= 2000), mood text, is_story boolean default false,
  media_path text,                                   -- fichier dans le stockage PRIVÉ
  view_secs int not null default 0 check (view_secs between 0 and 600),   -- 0 = permanente ; sinon durée PAR PERSONNE
  expires_at timestamptz,                            -- expiration globale (null = jamais)
  created_at timestamptz not null default now(), purged boolean not null default false
);
create table post_recipients (        -- destinataires figés à la publication
  post_id uuid references posts on delete cascade, user_id uuid references profiles on delete cascade,
  first_opened_at timestamptz,        -- heure serveur de la première ouverture
  primary key (post_id, user_id)
);
create index on post_recipients (user_id, post_id);
create table comments ( id uuid primary key default gen_random_uuid(), post_id uuid references posts on delete cascade, author uuid references profiles on delete cascade, body text not null check (char_length(body) <= 500), reply_to uuid references comments, created_at timestamptz default now() );
create table reactions ( post_id uuid references posts on delete cascade, user_id uuid references profiles on delete cascade, emoji text not null, primary key (post_id, user_id) );

create table conversations ( id uuid primary key default gen_random_uuid(), group_id uuid references groups, title text );
create table conversation_members ( conversation_id uuid references conversations on delete cascade, user_id uuid references profiles on delete cascade, primary key (conversation_id, user_id) );
create table messages (
  id uuid primary key default gen_random_uuid(), conversation_id uuid references conversations on delete cascade, sender uuid references profiles on delete cascade,
  body text default '' check (char_length(body) <= 2000), media_path text, ttl_secs int not null default 0 check (ttl_secs between 0 and 86400), created_at timestamptz default now(), edited_at timestamptz, pinned boolean default false
);
create table message_reads ( message_id uuid references messages on delete cascade, user_id uuid references profiles on delete cascade, read_at timestamptz not null default now(), primary key (message_id, user_id) );

create table events ( id uuid primary key default gen_random_uuid(), host uuid references profiles on delete cascade, title text not null, description text default '', place text default '', starts_at timestamptz not null );
create table event_participants ( event_id uuid references events on delete cascade, user_id uuid references profiles on delete cascade, rsvp text check (rsvp in ('yes','no','maybe')), primary key (event_id, user_id) );
create table notifications ( id uuid primary key default gen_random_uuid(), user_id uuid references profiles on delete cascade, body text not null, created_at timestamptz default now(), read boolean default false );
create table reports ( id uuid primary key default gen_random_uuid(), reporter uuid references profiles, target uuid references profiles, reason text not null, created_at timestamptz default now() );
create table game_sessions ( id uuid primary key default gen_random_uuid(), kind text not null, player_x uuid references profiles, player_o uuid references profiles, board jsonb not null default '[]', turn text default 'X', winner text, created_at timestamptz default now() );
create table user_settings ( user_id uuid primary key references profiles on delete cascade, quiet_hours jsonb, light_theme boolean default false, autoplay boolean default true );

-- ── Outils ─────────────────────────────────────────────────────────────────
create function are_friends(x uuid, y uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from friendships where a = least(x,y) and b = greatest(x,y)) $$;
create function is_blocked(x uuid, y uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from blocks where (blocker = x and blocked = y) or (blocker = y and blocked = x)) $$;

-- ── Row Level Security : tout est fermé par défaut ─────────────────────────
alter table profiles enable row level security; alter table friendships enable row level security; alter table friend_requests enable row level security; alter table blocks enable row level security;
alter table invitations enable row level security; alter table groups enable row level security; alter table group_members enable row level security; alter table friend_lists enable row level security; alter table friend_list_members enable row level security;
alter table posts enable row level security; alter table post_recipients enable row level security; alter table comments enable row level security; alter table reactions enable row level security;
alter table conversations enable row level security; alter table conversation_members enable row level security; alter table messages enable row level security; alter table message_reads enable row level security;
alter table events enable row level security; alter table event_participants enable row level security; alter table notifications enable row level security; alter table reports enable row level security; alter table game_sessions enable row level security; alter table user_settings enable row level security;

create policy "profil : moi ou un ami" on profiles for select using (id = auth.uid() or are_friends(id, auth.uid()));
create policy "profil : je modifie le mien" on profiles for update using (id = auth.uid());
create policy "amitiés : les miennes" on friendships for select using (auth.uid() in (a, b));
create policy "demandes : les miennes" on friend_requests for select using (auth.uid() in (from_id, to_id));
create policy "blocages : les miens" on blocks for all using (blocker = auth.uid()) with check (blocker = auth.uid());
create policy "groupes : mes groupes" on groups for select using (exists (select 1 from group_members m where m.group_id = id and m.user_id = auth.uid()));
create policy "membres : mes groupes" on group_members for select using (exists (select 1 from group_members m where m.group_id = group_id and m.user_id = auth.uid()));
create policy "listes : les miennes" on friend_lists for all using (owner = auth.uid()) with check (owner = auth.uid());
create policy "notifications : les miennes" on notifications for select using (user_id = auth.uid());
create policy "réglages : les miens" on user_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "conversations : les miennes" on conversations for select using (exists (select 1 from conversation_members m where m.conversation_id = id and m.user_id = auth.uid()));
create policy "membres conv : les miennes" on conversation_members for select using (exists (select 1 from conversation_members m where m.conversation_id = conversation_id and m.user_id = auth.uid()));
create policy "événements : hôte ou invité" on events for select using (host = auth.uid() or exists (select 1 from event_participants p where p.event_id = id and p.user_id = auth.uid()));
create policy "participants : mes événements" on event_participants for select using (user_id = auth.uid() or exists (select 1 from events e where e.id = event_id and e.host = auth.uid()));
-- posts, post_recipients, messages, message_reads, comments, reactions : AUCUNE politique de lecture directe.
-- La lecture passe uniquement par les fonctions ci-dessous (aucune fuite possible en changeant un identifiant).

-- ── Publier (calcule et fige les destinataires, côté serveur) ──────────────
create function publish_post(p_kind text, p_body text, p_media text, p_view_secs int, p_permanent boolean, p_story boolean, p_mode text, p_ids uuid[], p_group uuid, p_list uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); pid uuid; rec uuid[]; eph boolean;
begin
  if me is null then raise exception 'non connecté'; end if;
  if p_view_secs < 0 or p_view_secs > 600 then raise exception 'durée invalide'; end if;
  select coalesce(array_agg(f), '{}') into rec from (
    select case when a = me then b else a end as f from friendships where me in (a, b)
  ) fr where not is_blocked(me, f)
    and ( p_mode = 'all'
       or (p_mode = 'only'   and f = any(p_ids))
       or (p_mode = 'except' and not f = any(p_ids))
       or (p_mode = 'list'   and f in (select user_id from friend_list_members m join friend_lists l on l.id = m.list_id where l.id = p_list and l.owner = me)) );
  if p_mode = 'group' then
    select coalesce(array_agg(user_id), '{}') into rec from group_members where group_id = p_group and user_id <> me and not is_blocked(me, user_id)
      and exists (select 1 from group_members where group_id = p_group and user_id = me);
  elsif p_mode = 'me' then rec := '{}'; end if;
  if p_mode <> 'me' and coalesce(array_length(rec,1),0) = 0 then raise exception 'aucun destinataire'; end if;
  eph := not p_permanent and (p_view_secs > 0 or p_story);
  insert into posts (author, kind, body, media_path, view_secs, expires_at, is_story)
    values (me, p_kind, left(p_body, 2000), p_media, case when p_permanent then 0 else p_view_secs end, case when eph then now() + interval '24 hours' end, p_story) returning id into pid;
  insert into post_recipients (post_id, user_id) select pid, unnest(rec);
  return pid;
end $$;

-- ── Ouvrir : décision d'accès, chrono individuel basé sur l'heure SERVEUR ──
create function open_post(p_id uuid)
returns table (allowed boolean, reason text, remaining_ms bigint, body text, media_path text)
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); p posts; r post_recipients; left_ms bigint;
begin
  select * into p from posts where id = p_id;
  if not found then return query select false, 'missing', null::bigint, null::text, null::text; return; end if;
  if p.author = me then return query select true, 'author', null::bigint, p.body, p.media_path; return; end if;
  if is_blocked(p.author, me) then return query select false, 'blocked', null::bigint, null::text, null::text; return; end if;
  select * into r from post_recipients where post_id = p_id and user_id = me for update;
  if not found then return query select false, 'not-recipient', null::bigint, null::text, null::text; return; end if;
  if p.expires_at is not null and now() >= p.expires_at then return query select false, 'expired-global', null::bigint, null::text, null::text; return; end if;
  if p.purged then return query select false, 'purged', null::bigint, null::text, null::text; return; end if;
  if p.view_secs = 0 then return query select true, 'ok', null::bigint, p.body, p.media_path; return; end if;
  if r.first_opened_at is null then update post_recipients set first_opened_at = now() where post_id = p_id and user_id = me returning * into r; end if;
  left_ms := (extract(epoch from (r.first_opened_at + make_interval(secs => p.view_secs) - now())) * 1000)::bigint;
  if left_ms <= 0 then return query select false, 'expired-for-you', null::bigint, null::text, null::text; return; end if;
  return query select true, 'ok', left_ms, p.body, p.media_path;
end $$;
-- Le fichier lui-même : l'application demande une URL signée d'environ 10 s UNIQUEMENT après open_post(allowed = true).
-- Le bucket « media » est PRIVÉ (aucune lecture publique). Pas d'URL signée longue durée.

-- ── Nettoyage automatique des fichiers expirés (à planifier avec pg_cron toutes les minutes) ──
create function purge_expired() returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update posts p set purged = true, media_path = null, body = '' where not purged and (
      (expires_at is not null and now() >= expires_at)
   or (view_secs > 0 and not exists (select 1 from post_recipients r where r.post_id = p.id and (r.first_opened_at is null or now() < r.first_opened_at + make_interval(secs => p.view_secs)))));
  get diagnostics n = row_count; return n;   -- l'application supprime ensuite les fichiers du stockage correspondants
end $$;
-- select cron.schedule('nidami-purge', '* * * * *', 'select purge_expired()');

revoke all on function open_post(uuid), publish_post(text,text,text,int,boolean,boolean,text,uuid[],uuid,uuid), purge_expired() from public;
grant execute on function open_post(uuid), publish_post(text,text,text,int,boolean,boolean,text,uuid[],uuid,uuid) to authenticated;
-- purge_expired() : réservée au planificateur (service_role), jamais au navigateur.
