-- WhatsApp-first policy onboarding and product feedback share the same source
-- of truth as the merchant workspace.

alter table private.whatsapp_flow_state
  drop constraint if exists whatsapp_flow_state_step_check;
alter table private.whatsapp_flow_state
  add constraint whatsapp_flow_state_step_check check (step in (
    'MENU','AWAITING_LANGUAGE','AWAITING_ORDER','AWAITING_ITEM','AWAITING_QUANTITY',
    'AWAITING_REASON','AWAITING_CONDITION','COMPLETE',
    'POLICY_READY','AWAITING_POLICY_METHOD','AWAITING_POLICY_URL',
    'AWAITING_POLICY_TEXT','AWAITING_POLICY_WINDOW','REVIEWING_POLICY_RULE',
    'AWAITING_RULE_EDIT','AWAITING_POLICY_PUBLISH','ONBOARDING_PAUSED',
    'AWAITING_REPORT_MESSAGE','AWAITING_REPORT_CONFIRMATION'
  ));

create table public.product_reports (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete set null,
  conversation_id uuid references public.whatsapp_conversations(id) on delete set null,
  reporter_user_id uuid references auth.users(id) on delete set null,
  report_type text not null check (report_type in ('BUG','FEEDBACK')),
  status text not null default 'NEW' check (status in ('NEW','REVIEWING','PLANNED','RESOLVED','CLOSED')),
  message text not null check (char_length(message) between 2 and 4000),
  context jsonb not null default '{}'::jsonb,
  source_channel text not null default 'WHATSAPP' check (source_channel in ('WHATSAPP','WEB')),
  assigned_to uuid references auth.users(id) on delete set null,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index product_reports_store_status_idx on public.product_reports(store_id, status, created_at desc);

alter table public.product_reports enable row level security;
grant select, update on public.product_reports to authenticated;
create policy "members read product reports" on public.product_reports for select to authenticated
  using (store_id is not null and private.is_store_member(store_id));
create policy "admins update product reports" on public.product_reports for update to authenticated
  using (store_id is not null and private.has_store_role(store_id, array['owner','admin']))
  with check (store_id is not null and private.has_store_role(store_id, array['owner','admin']));

create or replace function public.publish_policy_draft_as_service(p_draft_id uuid, p_published_by uuid)
returns table(policy_version_id uuid, version_label text)
language plpgsql security definer set search_path = '' as $$
declare
  v_draft public.policy_drafts%rowtype;
  v_version_id uuid;
  v_version_label text;
  v_number integer;
begin
  select * into v_draft from public.policy_drafts where id = p_draft_id for update;
  if v_draft.id is null then raise exception 'draft_not_found'; end if;
  if not exists (
    select 1 from public.memberships
    where store_id = v_draft.store_id and user_id = p_published_by and role in ('owner','admin')
  ) then raise exception 'insufficient_permission'; end if;
  if jsonb_array_length(v_draft.rules) = 0 then raise exception 'rules_required'; end if;
  if exists (select 1 from jsonb_array_elements(v_draft.rules) rule where coalesce(rule ->> 'approvalState', 'pending') not in ('approved','edited')) then raise exception 'unresolved_rules'; end if;
  select coalesce(max(nullif(regexp_replace(pv.version_label, '[^0-9]', '', 'g'), '')::integer), 0) + 1
    into v_number from public.policy_versions pv where pv.store_id = v_draft.store_id;
  v_version_label := 'v' || v_number || '.0';
  insert into public.policy_versions(store_id, version_label, source_text, rules_snapshot, published_by)
  values (v_draft.store_id, v_version_label, v_draft.source_text, v_draft.rules, p_published_by)
  returning id into v_version_id;
  insert into public.audit_events(store_id, actor_user_id, event_type, entity_type, entity_id, metadata)
  values (v_draft.store_id, p_published_by, 'POLICY_PUBLISHED', 'policy_version', v_version_id,
    jsonb_build_object('version_label', v_version_label, 'draft_id', v_draft.id, 'channel', 'WHATSAPP'));
  delete from public.policy_drafts where id = v_draft.id;
  return query select v_version_id, v_version_label;
end;
$$;

revoke all on function public.publish_policy_draft_as_service(uuid,uuid) from public, anon, authenticated;
grant execute on function public.publish_policy_draft_as_service(uuid,uuid) to service_role;
