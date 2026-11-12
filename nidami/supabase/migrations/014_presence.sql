-- Présence : mon état (présent / occupé / plus tard / absent) et ma dernière activité.
alter table public.profiles add column if not exists presence text;
alter table public.profiles add column if not exists seen_at timestamptz;
