-- Live policy extraction/publishing and public Salla return entry point.

alter table public.stores
  add column if not exists return_code uuid not null default gen_random_uuid();
create unique index if not exists stores_return_code_idx on public.stores(return_code);
alter table public.commerce_connections
  add column if not exists refresh_started_at timestamptz;

drop function if exists public.get_salla_credential(uuid);
create function public.get_salla_credential(p_store_id uuid)
returns table (
  connection_id uuid,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  token_expires_at timestamptz,
  refresh_started_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select c.id, credentials.access_token_ciphertext,
    credentials.refresh_token_ciphertext, c.token_expires_at, c.refresh_started_at
  from public.commerce_connections c
  join private.commerce_credentials credentials on credentials.connection_id = c.id
  where c.store_id = p_store_id and c.platform = 'salla' and c.status = 'CONNECTED'
  limit 1;
$$;

create or replace function public.claim_salla_refresh(p_connection_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.commerce_connections
  set refresh_started_at = now(), updated_at = now()
  where id = p_connection_id
    and status = 'CONNECTED'
    and (refresh_started_at is null or refresh_started_at < now() - interval '2 minutes');
  return found;
end;
$$;

create table if not exists private.public_rate_limits (
  bucket text primary key,
  attempts integer not null default 0,
  window_started_at timestamptz not null default now()
);

create or replace function public.consume_public_rate_limit(
  p_bucket text,
  p_limit integer default 10,
  p_window_seconds integer default 600
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_allowed boolean;
begin
  insert into private.public_rate_limits(bucket, attempts, window_started_at)
  values (p_bucket, 1, now())
  on conflict (bucket) do update set
    attempts = case
      when private.public_rate_limits.window_started_at < now() - make_interval(secs => p_window_seconds)
        then 1
      else private.public_rate_limits.attempts + 1
    end,
    window_started_at = case
      when private.public_rate_limits.window_started_at < now() - make_interval(secs => p_window_seconds)
        then now()
      else private.public_rate_limits.window_started_at
    end
  returning attempts <= p_limit into v_allowed;
  return v_allowed;
end;
$$;

create or replace function public.rotate_salla_credential(
  p_connection_id uuid,
  p_access_token_ciphertext text,
  p_refresh_token_ciphertext text,
  p_token_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update private.commerce_credentials
  set access_token_ciphertext = p_access_token_ciphertext,
      refresh_token_ciphertext = p_refresh_token_ciphertext,
      updated_at = now()
  where connection_id = p_connection_id;
  if not found then raise exception 'credential_not_found'; end if;

  update public.commerce_connections
  set token_expires_at = p_token_expires_at,
      status = 'CONNECTED',
      refresh_started_at = null,
      last_error_code = null,
      updated_at = now()
  where id = p_connection_id;
end;
$$;

create or replace function public.publish_policy_draft(p_draft_id uuid)
returns table(policy_version_id uuid, version_label text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_draft public.policy_drafts%rowtype;
  v_version_id uuid;
  v_version_label text;
  v_number integer;
begin
  select * into v_draft from public.policy_drafts where id = p_draft_id for update;
  if v_draft.id is null then raise exception 'draft_not_found'; end if;
  if not private.has_store_role(v_draft.store_id, array['owner','admin']) then
    raise exception 'insufficient_permission';
  end if;
  if jsonb_array_length(v_draft.rules) = 0 then raise exception 'rules_required'; end if;
  if exists (
    select 1 from jsonb_array_elements(v_draft.rules) rule
    where coalesce(rule ->> 'approvalState', 'pending') not in ('approved','edited')
  ) then raise exception 'unresolved_rules'; end if;

  select coalesce(max(nullif(regexp_replace(pv.version_label, '[^0-9]', '', 'g'), '')::integer), 0) + 1
    into v_number from public.policy_versions pv where pv.store_id = v_draft.store_id;
  v_version_label := 'v' || v_number || '.0';

  insert into public.policy_versions(store_id, version_label, source_text, rules_snapshot, published_by)
  values (v_draft.store_id, v_version_label, v_draft.source_text, v_draft.rules, auth.uid())
  returning id into v_version_id;

  insert into public.audit_events(store_id, actor_user_id, event_type, entity_type, entity_id, metadata)
  values (v_draft.store_id, auth.uid(), 'POLICY_PUBLISHED', 'policy_version', v_version_id,
    jsonb_build_object('version_label', v_version_label, 'draft_id', v_draft.id));
  delete from public.policy_drafts where id = v_draft.id;
  return query select v_version_id, v_version_label;
end;
$$;

create or replace function public.record_return_decision(
  p_store_id uuid,
  p_policy_version_id uuid,
  p_order_id text,
  p_outcome text,
  p_reason_codes text[],
  p_order_facts jsonb,
  p_policy_snapshot jsonb,
  p_customer_snapshot jsonb,
  p_item_snapshot jsonb,
  p_create_case boolean
)
returns table(decision_id uuid, case_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_decision_id uuid;
  v_case_id uuid;
begin
  if p_outcome not in ('ELIGIBLE','NOT_ELIGIBLE','MANUAL_REVIEW') then raise exception 'invalid_outcome'; end if;
  if not exists (select 1 from public.policy_versions where id = p_policy_version_id and store_id = p_store_id) then
    raise exception 'invalid_policy';
  end if;
  insert into public.eligibility_decisions(store_id, policy_version_id, order_id, outcome, reason_codes, order_facts_snapshot, policy_snapshot)
  values (p_store_id, p_policy_version_id, p_order_id, p_outcome, p_reason_codes, p_order_facts, p_policy_snapshot)
  returning id into v_decision_id;

  if p_create_case then
    insert into public.return_cases(store_id, decision_id, order_id, customer_snapshot, item_snapshot)
    values (p_store_id, v_decision_id, p_order_id, p_customer_snapshot, p_item_snapshot)
    returning id into v_case_id;
    insert into public.audit_events(store_id, event_type, entity_type, entity_id, metadata)
    values (p_store_id, 'RETURN_CASE_CREATED', 'return_case', v_case_id,
      jsonb_build_object('decision_id', v_decision_id, 'outcome', p_outcome));
  end if;
  insert into public.audit_events(store_id, event_type, entity_type, entity_id, metadata)
  values (p_store_id, 'ELIGIBILITY_DECIDED', 'eligibility_decision', v_decision_id,
    jsonb_build_object('outcome', p_outcome, 'reason_codes', p_reason_codes));
  return query select v_decision_id, v_case_id;
end;
$$;

create or replace function public.create_return_case_from_decision(
  p_decision_id uuid,
  p_customer_snapshot jsonb,
  p_item_snapshot jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_decision public.eligibility_decisions%rowtype;
  v_case_id uuid;
begin
  select * into v_decision from public.eligibility_decisions where id = p_decision_id;
  if v_decision.id is null or v_decision.outcome = 'NOT_ELIGIBLE' then raise exception 'case_not_allowed'; end if;
  select id into v_case_id from public.return_cases where decision_id = p_decision_id;
  if v_case_id is not null then return v_case_id; end if;
  insert into public.return_cases(store_id, decision_id, order_id, customer_snapshot, item_snapshot)
  values (v_decision.store_id, v_decision.id, v_decision.order_id, p_customer_snapshot, p_item_snapshot)
  returning id into v_case_id;
  insert into public.audit_events(store_id, event_type, entity_type, entity_id, metadata)
  values (v_decision.store_id, 'RETURN_CASE_CREATED', 'return_case', v_case_id,
    jsonb_build_object('decision_id', v_decision.id, 'outcome', v_decision.outcome));
  return v_case_id;
end;
$$;

create or replace function public.update_return_case_status(p_case_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_case public.return_cases%rowtype;
  v_allowed boolean;
begin
  select * into v_case from public.return_cases where id = p_case_id for update;
  if v_case.id is null then raise exception 'case_not_found'; end if;
  if not private.has_store_role(v_case.store_id, array['owner','admin','member']) then raise exception 'insufficient_permission'; end if;
  v_allowed := case v_case.status
    when 'OPEN' then p_status in ('AWAITING_ITEM','RESOLVED','CANCELLED')
    when 'AWAITING_ITEM' then p_status in ('RECEIVED','CANCELLED')
    when 'RECEIVED' then p_status = 'RESOLVED'
    else false end;
  if not v_allowed then raise exception 'invalid_transition'; end if;
  update public.return_cases set status = p_status, updated_at = now() where id = p_case_id;
  insert into public.audit_events(store_id, actor_user_id, event_type, entity_type, entity_id, metadata)
  values (v_case.store_id, auth.uid(), 'RETURN_CASE_STATUS_CHANGED', 'return_case', p_case_id,
    jsonb_build_object('from', v_case.status, 'to', p_status));
end;
$$;

revoke all on function public.consume_public_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.get_salla_credential(uuid) from public, anon, authenticated;
revoke all on function public.claim_salla_refresh(uuid) from public, anon, authenticated;
revoke all on function public.rotate_salla_credential(uuid, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.publish_policy_draft(uuid) from public, anon;
revoke all on function public.record_return_decision(uuid, uuid, text, text, text[], jsonb, jsonb, jsonb, jsonb, boolean) from public, anon, authenticated;
revoke all on function public.create_return_case_from_decision(uuid, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.update_return_case_status(uuid, text) from public, anon;
grant execute on function public.consume_public_rate_limit(text, integer, integer) to service_role;
grant execute on function public.get_salla_credential(uuid) to service_role;
grant execute on function public.claim_salla_refresh(uuid) to service_role;
grant execute on function public.rotate_salla_credential(uuid, text, text, timestamptz) to service_role;
grant execute on function public.publish_policy_draft(uuid) to authenticated;
grant execute on function public.record_return_decision(uuid, uuid, text, text, text[], jsonb, jsonb, jsonb, jsonb, boolean) to service_role;
grant execute on function public.create_return_case_from_decision(uuid, jsonb, jsonb) to service_role;
grant execute on function public.update_return_case_status(uuid, text) to authenticated;
