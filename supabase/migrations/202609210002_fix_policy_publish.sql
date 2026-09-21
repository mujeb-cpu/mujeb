-- Qualify policy version columns inside PL/pgSQL to avoid output-name ambiguity.
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
  if not private.has_store_role(v_draft.store_id, array['owner','admin']) then raise exception 'insufficient_permission'; end if;
  if jsonb_array_length(v_draft.rules) = 0 then raise exception 'rules_required'; end if;
  if exists (select 1 from jsonb_array_elements(v_draft.rules) rule where coalesce(rule ->> 'approvalState', 'pending') not in ('approved','edited')) then raise exception 'unresolved_rules'; end if;

  select coalesce(max(nullif(regexp_replace(pv.version_label, '[^0-9]', '', 'g'), '')::integer), 0) + 1
    into v_number from public.policy_versions pv where pv.store_id = v_draft.store_id;
  v_version_label := 'v' || v_number || '.0';

  insert into public.policy_versions(store_id, version_label, source_text, rules_snapshot, published_by)
  values (v_draft.store_id, v_version_label, v_draft.source_text, v_draft.rules, auth.uid()) returning id into v_version_id;
  insert into public.audit_events(store_id, actor_user_id, event_type, entity_type, entity_id, metadata)
  values (v_draft.store_id, auth.uid(), 'POLICY_PUBLISHED', 'policy_version', v_version_id, jsonb_build_object('version_label', v_version_label, 'draft_id', v_draft.id));
  delete from public.policy_drafts where id = v_draft.id;
  return query select v_version_id, v_version_label;
end;
$$;

revoke all on function public.publish_policy_draft(uuid) from public, anon;
grant execute on function public.publish_policy_draft(uuid) to authenticated;
