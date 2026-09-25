create table private.whatsapp_onboarding_tokens (
  token_hash text primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  conversation_id uuid not null references public.whatsapp_conversations(id) on delete cascade,
  stage text not null check (stage in ('SALLA_PENDING','POLICY_PENDING','TEST_PENDING','COMPLETE')),
  expires_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

revoke all on table private.whatsapp_onboarding_tokens from public, anon, authenticated;

create or replace function public.create_whatsapp_onboarding_token(
  p_token_hash text, p_store_id uuid, p_conversation_id uuid, p_expires_at timestamptz
) returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from private.whatsapp_onboarding_tokens where expires_at < now() or completed_at is not null;
  insert into private.whatsapp_onboarding_tokens(token_hash, store_id, conversation_id, stage, expires_at)
  values (p_token_hash, p_store_id, p_conversation_id, 'SALLA_PENDING', p_expires_at);
end;
$$;

create or replace function public.get_whatsapp_onboarding_token(p_token_hash text)
returns table(store_id uuid, conversation_id uuid, stage text)
language sql security definer set search_path = '' as $$
  select token.store_id, token.conversation_id, token.stage
  from private.whatsapp_onboarding_tokens token
  where token.token_hash = p_token_hash and token.expires_at > now() and token.completed_at is null;
$$;

create or replace function public.advance_whatsapp_onboarding_token(
  p_token_hash text, p_expected_stage text, p_next_stage text, p_extend_until timestamptz default null
) returns table(store_id uuid, conversation_id uuid)
language plpgsql security definer set search_path = '' as $$
begin
  return query update private.whatsapp_onboarding_tokens token
  set stage = p_next_stage,
      expires_at = coalesce(p_extend_until, token.expires_at),
      completed_at = case when p_next_stage = 'COMPLETE' then now() else null end
  where token.token_hash = p_token_hash and token.stage = p_expected_stage
    and token.expires_at > now() and token.completed_at is null
  returning token.store_id, token.conversation_id;
end;
$$;

revoke all on function public.create_whatsapp_onboarding_token(text,uuid,uuid,timestamptz) from public, anon, authenticated;
revoke all on function public.get_whatsapp_onboarding_token(text) from public, anon, authenticated;
revoke all on function public.advance_whatsapp_onboarding_token(text,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.create_whatsapp_onboarding_token(text,uuid,uuid,timestamptz) to service_role;
grant execute on function public.get_whatsapp_onboarding_token(text) to service_role;
grant execute on function public.advance_whatsapp_onboarding_token(text,text,text,timestamptz) to service_role;

alter table public.commerce_connections add column if not exists public_store_url text;
