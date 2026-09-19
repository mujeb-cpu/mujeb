-- Server-only database functions used by the Salla Edge Functions.
-- These functions deliberately keep OAuth state and credentials outside the
-- browser-facing schema while allowing the service role to update them.

create or replace function public.create_salla_oauth_state(
  p_state_hash text,
  p_store_id uuid,
  p_redirect_path text,
  p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from private.oauth_states
  where expires_at < now() or used_at is not null;

  insert into private.oauth_states (state_hash, store_id, platform, redirect_path, expires_at)
  values (p_state_hash, p_store_id, 'salla', p_redirect_path, p_expires_at);
end;
$$;

create or replace function public.get_salla_credential(p_store_id uuid)
returns table (connection_id uuid, access_token_ciphertext text)
language sql security definer set search_path = ''
as $$
  select c.id, credentials.access_token_ciphertext
  from public.commerce_connections c
  join private.commerce_credentials credentials on credentials.connection_id = c.id
  where c.store_id = p_store_id and c.platform = 'salla' and c.status = 'CONNECTED'
  limit 1;
$$;

create or replace function public.disconnect_salla_connection(p_store_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_connection_id uuid;
begin
  select id into v_connection_id from public.commerce_connections
  where store_id = p_store_id and platform = 'salla';
  if v_connection_id is not null then
    delete from private.commerce_credentials where commerce_credentials.connection_id = v_connection_id;
    update public.commerce_connections set status = 'REVOKED', updated_at = now(), token_expires_at = null where id = v_connection_id;
    insert into public.audit_events (store_id, event_type, entity_type, entity_id, metadata)
    values (p_store_id, 'COMMERCE_STORE_DISCONNECTED', 'commerce_connection', v_connection_id, jsonb_build_object('platform', 'salla'));
  end if;
end;
$$;

create or replace function public.consume_salla_oauth_state(p_state_hash text)
returns table (store_id uuid, redirect_path text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update private.oauth_states as oauth_state
  set used_at = now()
  where oauth_state.state_hash = p_state_hash
    and oauth_state.platform = 'salla'
    and oauth_state.used_at is null
    and oauth_state.expires_at > now()
  returning oauth_state.store_id, oauth_state.redirect_path;
end;
$$;

create or replace function public.finalize_salla_connection(
  p_store_id uuid,
  p_external_store_id text,
  p_external_store_name text,
  p_scopes text[],
  p_token_expires_at timestamptz,
  p_access_token_ciphertext text,
  p_refresh_token_ciphertext text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  connection_id uuid;
begin
  insert into public.commerce_connections (
    store_id, platform, external_store_id, external_store_name, status,
    scopes, token_expires_at, connected_at, last_error_code, updated_at
  ) values (
    p_store_id, 'salla', p_external_store_id, p_external_store_name, 'CONNECTED',
    coalesce(p_scopes, '{}'), p_token_expires_at, now(), null, now()
  )
  on conflict (store_id, platform) do update set
    external_store_id = excluded.external_store_id,
    external_store_name = excluded.external_store_name,
    status = 'CONNECTED',
    scopes = excluded.scopes,
    token_expires_at = excluded.token_expires_at,
    connected_at = coalesce(public.commerce_connections.connected_at, now()),
    last_error_code = null,
    updated_at = now()
  returning id into connection_id;

  insert into private.commerce_credentials (
    connection_id, access_token_ciphertext, refresh_token_ciphertext,
    encryption_key_version, updated_at
  ) values (
    connection_id, p_access_token_ciphertext, p_refresh_token_ciphertext, 1, now()
  )
  on conflict (connection_id) do update set
    access_token_ciphertext = excluded.access_token_ciphertext,
    refresh_token_ciphertext = excluded.refresh_token_ciphertext,
    encryption_key_version = excluded.encryption_key_version,
    updated_at = now();

  insert into public.audit_events (store_id, event_type, entity_type, entity_id, metadata)
  values (p_store_id, 'COMMERCE_STORE_CONNECTED', 'commerce_connection', connection_id,
    jsonb_build_object('platform', 'salla', 'external_store_id', p_external_store_id));

  return connection_id;
end;
$$;

revoke all on function public.create_salla_oauth_state(text, uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function public.consume_salla_oauth_state(text) from public, anon, authenticated;
revoke all on function public.finalize_salla_connection(uuid, text, text, text[], timestamptz, text, text) from public, anon, authenticated;
revoke all on function public.get_salla_credential(uuid) from public, anon, authenticated;
revoke all on function public.disconnect_salla_connection(uuid) from public, anon, authenticated;
grant execute on function public.create_salla_oauth_state(text, uuid, text, timestamptz) to service_role;
grant execute on function public.consume_salla_oauth_state(text) to service_role;
grant execute on function public.finalize_salla_connection(uuid, text, text, text[], timestamptz, text, text) to service_role;
grant execute on function public.get_salla_credential(uuid) to service_role;
grant execute on function public.disconnect_salla_connection(uuid) to service_role;
