-- Deliver financing-request alerts asynchronously through pg_net. The trigger
-- queues the HTTP request after the lead is stored, so Meta or Edge Function
-- failures can never roll back or hide the financing request.

create extension if not exists pg_net with schema extensions;

create or replace function private.queue_financing_whatsapp_alert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform net.http_post(
    url := 'https://clwczcvxosudfevjznmk.supabase.co/functions/v1/financing-alert',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('requestId', new.id),
    timeout_milliseconds := 10000
  );
  return new;
exception when others then
  raise warning 'Unable to queue financing WhatsApp alert for %: %', new.id, sqlerrm;
  return new;
end;
$$;

revoke all on function private.queue_financing_whatsapp_alert() from public, anon, authenticated;

drop trigger if exists financing_request_whatsapp_alert on public.financing_requests;
create trigger financing_request_whatsapp_alert
after insert on public.financing_requests
for each row execute function private.queue_financing_whatsapp_alert();
