-- NOTIIF : rangement des fichiers (vocaux, photos, vidéos) dans le Stockage + temps réel.
-- À coller une seule fois dans Supabase > SQL Editor > Run. On peut le relancer sans risque.

-- 1) Le « placard » privé des fichiers.
insert into storage.buckets (id, name, public, file_size_limit)
values ('notiif-media', 'notiif-media', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

-- Pour retrouver vite à qui appartient un fichier (seules les petites adresses « sb:… » sont indexées).
create index if not exists messages_media_sb on public.messages (media) where left(media, 3) = 'sb:';
create index if not exists group_messages_media_sb on public.group_messages (media) where left(media, 3) = 'sb:';

-- 2) Règles : chacun range ses fichiers dans son propre dossier ;
--    on ne peut lire un fichier que si on l'a envoyé, si on en est le destinataire, ou si on est membre du groupe.
drop policy if exists "notiif media: deposer" on storage.objects;
create policy "notiif media: deposer" on storage.objects for insert to authenticated
  with check (bucket_id = 'notiif-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "notiif media: remplacer" on storage.objects;
create policy "notiif media: remplacer" on storage.objects for update to authenticated
  using (bucket_id = 'notiif-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "notiif media: supprimer" on storage.objects;
create policy "notiif media: supprimer" on storage.objects for delete to authenticated
  using (bucket_id = 'notiif-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "notiif media: lire" on storage.objects;
create policy "notiif media: lire" on storage.objects for select to authenticated
  using (
    bucket_id = 'notiif-media' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.messages m
                 where left(m.media, 3) = 'sb:' and m.media = 'sb:' || storage.objects.name and m.recipient = auth.uid())
      or exists (select 1 from public.group_messages g
                 where left(g.media, 3) = 'sb:' and g.media = 'sb:' || storage.objects.name and public.is_member(g.group_id))
    )
  );

-- 3) Temps réel : le serveur prévient l'appli dès qu'il y a du nouveau (plus besoin de demander chaque seconde).
do $$
declare t text;
begin
  foreach t in array array['messages', 'group_messages', 'msg_reactions', 'typing'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null; when others then null;
    end;
  end loop;
end $$;
