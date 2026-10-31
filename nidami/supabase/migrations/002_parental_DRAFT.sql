-- ============================================================================
-- BROUILLON — contrôle parental (comptes « enfant supervisé »).
-- JAMAIS EXÉCUTÉ, NON TESTÉ. À relire, tester sur un Supabase de test et faire
-- valider par un juriste avant toute utilisation. Ne pas mettre en production tel quel.
-- Principe : TOUTE la protection est côté serveur (RLS + fonctions). Rien ne repose sur l'appli.
-- ============================================================================

-- 1. Profil : un compte supervisé est créé par un parent, et l'enfant ne peut jamais lever la supervision.
alter table profiles add column if not exists supervised boolean not null default false;
alter table profiles add column if not exists age_band text check (age_band in ('under13', '13_14'));  -- pas de date de naissance stockée

create table guardianships (
  child uuid primary key references profiles on delete cascade,
  guardian uuid not null references profiles on delete restrict,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table parent_approvals (          -- amis à approuver par le parent
  id uuid primary key default gen_random_uuid(),
  child uuid not null references profiles on delete cascade,
  other uuid not null references profiles on delete cascade,
  requested_at timestamptz not null default now(),
  decision text check (decision in ('approved', 'refused')),
  decided_at timestamptz,
  unique (child, other)
);

create table supervision_rules (
  child uuid primary key references profiles on delete cascade,
  paused boolean not null default false,
  quiet_from time, quiet_to time          -- horaires sans utilisation
);

create table supervision_alerts (        -- alertes pour le parent
  id uuid primary key default gen_random_uuid(),
  guardian uuid not null references profiles on delete cascade,
  child uuid not null references profiles on delete cascade,
  kind text not null check (kind in ('forbidden_content', 'harassment', 'report', 'stranger_contact', 'friend_request')),
  detail text, created_at timestamptz not null default now(), read_at timestamptz
);

create table guardian_access_log (       -- chaque lecture de conversation par un parent est tracée ET notifiée à l'enfant
  id uuid primary key default gen_random_uuid(),
  guardian uuid not null references profiles, child uuid not null references profiles,
  conversation_id uuid not null references conversations,
  at timestamptz not null default now()
);

alter table guardianships enable row level security; alter table parent_approvals enable row level security;
alter table supervision_rules enable row level security; alter table supervision_alerts enable row level security;
alter table guardian_access_log enable row level security;

-- 2. Qui voit quoi
create policy "tutelle : parent ou enfant (lecture)" on guardianships for select using (auth.uid() in (child, guardian));
create policy "approbations : parent ou enfant (lecture)" on parent_approvals for select
  using (auth.uid() = child or auth.uid() = (select guardian from guardianships g where g.child = parent_approvals.child and g.revoked_at is null));
create policy "règles : parent ou enfant (lecture)" on supervision_rules for select
  using (auth.uid() = child or auth.uid() = (select guardian from guardianships g where g.child = supervision_rules.child and g.revoked_at is null));
create policy "alertes : le parent" on supervision_alerts for select using (guardian = auth.uid());
create policy "journal : parent et enfant" on guardian_access_log for select using (auth.uid() in (guardian, child));
-- AUCUNE politique d'écriture : tout passe par les fonctions ci-dessous.

-- 3. L'enfant ne peut pas modifier sa propre supervision (même via l'API directe).
create function protect_supervision() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.supervised is distinct from old.supervised or new.age_band is distinct from old.age_band)
     and coalesce(current_setting('app.parent_action', true), '') <> 'on' then
    raise exception 'supervision: modification réservée au parent';
  end if;
  return new;
end $$;
create trigger profiles_protect_supervision before update on profiles for each row execute function protect_supervision();

-- 4. Le parent crée / règle le compte (fonctions à compléter : création du compte auth côté serveur, vérification du parent).
create function is_guardian_of(c uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from guardianships g where g.child = c and g.guardian = auth.uid() and g.revoked_at is null) $$;

create function parent_decide(p_child uuid, p_other uuid, p_ok boolean) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_guardian_of(p_child) then raise exception 'pas votre enfant'; end if;
  update parent_approvals set decision = case when p_ok then 'approved' else 'refused' end, decided_at = now()
   where child = p_child and other = p_other and decision is null;
end $$;

create function parent_set_rules(p_child uuid, p_paused boolean, p_from time, p_to time) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_guardian_of(p_child) then raise exception 'pas votre enfant'; end if;
  insert into supervision_rules (child, paused, quiet_from, quiet_to) values (p_child, p_paused, p_from, p_to)
  on conflict (child) do update set paused = excluded.paused, quiet_from = excluded.quiet_from, quiet_to = excluded.quiet_to;
end $$;

-- 5. Lecture d'une conversation par le parent : toujours journalisée, l'enfant est TOUJOURS prévenu.
--    Moins de 13 ans : lecture libre. 13-14 ans : lecture possible mais notifiée à l'enfant (mêmes règles de trace).
create function parent_open_conversation(p_child uuid, p_conv uuid) returns setof messages language plpgsql security definer set search_path = public as $$
begin
  if not is_guardian_of(p_child) then raise exception 'pas votre enfant'; end if;
  if not exists (select 1 from conversation_members m where m.conversation_id = p_conv and m.user_id = p_child) then raise exception 'conversation inconnue'; end if;
  insert into guardian_access_log (guardian, child, conversation_id) values (auth.uid(), p_child, p_conv);
  insert into notifications (user_id, kind, body) values (p_child, 'parent_read', 'Un parent a lu une conversation.');  -- colonnes à adapter au schéma réel
  return query select * from messages where conversation_id = p_conv order by created_at;
end $$;

-- 6. À BRANCHER dans les fonctions existantes (non fait ici, à écrire avec les vraies fonctions) :
--  a) accepter / envoyer une demande d'ami : si le profil est supervisé, créer une ligne parent_approvals et NE PAS créer l'amitié avant 'approved' ;
--  b) un compte supervisé est forcé en visibilité « Invisible » (pas de recherche publique) et ne peut pas publier hors de ses amis approuvés ;
--  c) publish_post / send_message : refuser si supervision_rules.paused ou si l'heure est dans la plage de silence ;
--  d) report / détection de contenu interdit / contact d'un inconnu : insérer une ligne supervision_alerts pour le parent ;
--  e) les amis d'un compte supervisé voient un badge « compte supervisé » (information avant d'écrire).
