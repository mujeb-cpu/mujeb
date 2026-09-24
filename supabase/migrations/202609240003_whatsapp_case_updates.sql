-- Notify WhatsApp customers when a merchant advances a return case. pg_net
-- keeps notification delivery outside the status-update transaction.

create or replace function private.queue_whatsapp_case_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    perform net.http_post(
      url := 'https://clwczcvxosudfevjznmk.supabase.co/functions/v1/whatsapp-case-update',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'caseId', new.id,
        'status', new.status,
        'changedAt', new.updated_at
      ),
      timeout_milliseconds := 10000
    );
  end if;
  return new;
exception when others then
  raise warning 'Unable to queue WhatsApp case update for %: %', new.id, sqlerrm;
  return new;
end;
$$;

revoke all on function private.queue_whatsapp_case_update() from public, anon, authenticated;

drop trigger if exists return_case_whatsapp_update on public.return_cases;
create trigger return_case_whatsapp_update
after update of status on public.return_cases
for each row execute function private.queue_whatsapp_case_update();
