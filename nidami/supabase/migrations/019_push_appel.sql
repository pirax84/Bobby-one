-- Prévient le téléphone (application fermée) quand quelqu'un l'appelle.
create or replace function public.notify_push_call() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  if new.kind = 'offer' then
    begin
      perform net.http_post(
        url := 'https://jtymrohpjhiukjreqewb.supabase.co/functions/v1/smooth-action',
        headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', 'SECRET'),
        body := jsonb_build_object('record', jsonb_build_object('id', new.id, 'sender', new.from_id, 'recipient', new.to_id, 'call', true))
      );
    exception when others then null;
    end;
  end if;
  return new;
end $$;
drop trigger if exists push_on_call on public.call_signals;
create trigger push_on_call after insert on public.call_signals for each row execute function public.notify_push_call();
