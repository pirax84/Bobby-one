-- Correctif : voir le prénom de quelqu'un qui m'a demandé en ami (le nom de colonne « id » était ambigu).
drop policy if exists "profil: moi, mes amis, mes demandes" on public.profiles;
create policy "profil: moi, mes amis, mes demandes" on public.profiles for select to authenticated using (
  profiles.id = auth.uid() or public.are_friends(auth.uid(), profiles.id)
  or exists (select 1 from public.friend_requests r where (r.from_id = profiles.id and r.to_id = auth.uid()) or (r.to_id = profiles.id and r.from_id = auth.uid()))
);
