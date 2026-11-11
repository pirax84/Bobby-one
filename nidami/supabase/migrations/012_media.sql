-- Vocaux, photos et vidéos dans les messages.
alter table public.messages add column if not exists media text;
alter table public.messages add column if not exists media_kind text check (media_kind is null or media_kind in ('audio','image','video'));
