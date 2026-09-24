-- Private server-side state for multi-message WhatsApp journeys. It may hold a
-- short-lived signed order token and selections, so it must never be exposed
-- through the browser Data API.

create table private.whatsapp_flow_state (
  conversation_id uuid primary key references public.whatsapp_conversations(id) on delete cascade,
  step text not null default 'MENU' check (step in (
    'MENU','AWAITING_ORDER','AWAITING_ITEM','AWAITING_QUANTITY',
    'AWAITING_REASON','AWAITING_CONDITION','COMPLETE'
  )),
  context jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

revoke all on table private.whatsapp_flow_state from public, anon, authenticated;

create or replace function public.get_whatsapp_flow_state(p_conversation_id uuid)
returns table(step text, context jsonb)
language sql security definer set search_path = '' as $$
  select state.step, state.context from private.whatsapp_flow_state state
  where state.conversation_id = p_conversation_id;
$$;

create or replace function public.set_whatsapp_flow_state(p_conversation_id uuid, p_step text, p_context jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into private.whatsapp_flow_state(conversation_id, step, context, updated_at)
  values (p_conversation_id, p_step, coalesce(p_context, '{}'::jsonb), now())
  on conflict (conversation_id) do update
  set step = excluded.step, context = excluded.context, updated_at = now();
end;
$$;

revoke all on function public.get_whatsapp_flow_state(uuid) from public, anon, authenticated;
revoke all on function public.set_whatsapp_flow_state(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.get_whatsapp_flow_state(uuid) to service_role;
grant execute on function public.set_whatsapp_flow_state(uuid, text, jsonb) to service_role;
