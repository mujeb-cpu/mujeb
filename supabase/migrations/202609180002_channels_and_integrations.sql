-- Relod MVP: Salla and WhatsApp integration boundaries.
-- Apply after 202609180001_initial_mvp.sql.

create table public.commerce_connections (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  platform text not null check (platform in ('salla')),
  external_store_id text not null,
  external_store_name text,
  status text not null default 'CONNECTING' check (status in ('CONNECTING','CONNECTED','EXPIRED','REVOKED','ERROR')),
  scopes text[] not null default '{}',
  token_expires_at timestamptz,
  last_synced_at timestamptz,
  last_error_code text,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, external_store_id),
  unique (store_id, platform)
);
create index commerce_connections_store_idx on public.commerce_connections(store_id);

-- Never expose credentials through the browser Data API. Edge Functions use a
-- secret key and encrypt these values before storage.
create table private.commerce_credentials (
  connection_id uuid primary key references public.commerce_connections(id) on delete cascade,
  access_token_ciphertext text not null,
  refresh_token_ciphertext text,
  encryption_key_version integer not null default 1,
  updated_at timestamptz not null default now()
);

create table private.oauth_states (
  state_hash text primary key,
  store_id uuid not null references public.stores(id) on delete cascade,
  platform text not null check (platform in ('salla')),
  redirect_path text not null default '/app/integrations',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index oauth_states_expiry_idx on private.oauth_states(expires_at);

create table public.integration_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade,
  provider text not null check (provider in ('salla','whatsapp')),
  external_event_id text not null,
  event_type text not null,
  payload_digest text not null,
  status text not null default 'RECEIVED' check (status in ('RECEIVED','PROCESSING','PROCESSED','FAILED','IGNORED')),
  attempts integer not null default 0,
  last_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, external_event_id)
);
create index integration_events_status_idx on public.integration_events(provider, status, received_at);
create index integration_events_store_idx on public.integration_events(store_id, received_at desc);

create table public.whatsapp_connections (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  business_account_id text not null,
  phone_number_id text not null,
  display_phone_number text,
  verified_name text,
  status text not null default 'CONNECTING' check (status in ('CONNECTING','CONNECTED','RESTRICTED','DISCONNECTED','ERROR')),
  quality_rating text,
  last_webhook_at timestamptz,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id),
  unique (phone_number_id)
);

create table private.whatsapp_credentials (
  connection_id uuid primary key references public.whatsapp_connections(id) on delete cascade,
  access_token_ciphertext text not null,
  app_secret_ciphertext text,
  encryption_key_version integer not null default 1,
  updated_at timestamptz not null default now()
);

create table public.whatsapp_contacts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  wa_id text not null,
  display_name text,
  locale text not null default 'ar' check (locale in ('ar','en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, wa_id)
);

create table public.whatsapp_conversations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  contact_id uuid not null references public.whatsapp_contacts(id) on delete cascade,
  return_case_id uuid references public.return_cases(id) on delete set null,
  state text not null default 'VERIFYING_ORDER' check (state in ('VERIFYING_ORDER','CAPTURING_RETURN','EVALUATING','ANSWERED','HANDED_TO_HUMAN','CLOSED')),
  language text not null default 'ar' check (language in ('ar','en')),
  service_window_expires_at timestamptz,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index whatsapp_conversations_store_idx on public.whatsapp_conversations(store_id, last_message_at desc);

create table public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  conversation_id uuid not null references public.whatsapp_conversations(id) on delete cascade,
  external_message_id text not null,
  direction text not null check (direction in ('INBOUND','OUTBOUND')),
  message_type text not null check (message_type in ('TEXT','INTERACTIVE','FLOW','TEMPLATE','SYSTEM','UNSUPPORTED')),
  template_name text,
  body text,
  status text not null default 'RECEIVED' check (status in ('QUEUED','SENT','DELIVERED','READ','RECEIVED','FAILED')),
  failure_code text,
  safe_metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (external_message_id)
);
create index whatsapp_messages_conversation_idx on public.whatsapp_messages(conversation_id, occurred_at);

alter table public.commerce_connections enable row level security;
alter table public.integration_events enable row level security;
alter table public.whatsapp_connections enable row level security;
alter table public.whatsapp_contacts enable row level security;
alter table public.whatsapp_conversations enable row level security;
alter table public.whatsapp_messages enable row level security;

revoke all on table public.commerce_connections, public.integration_events,
  public.whatsapp_connections, public.whatsapp_contacts,
  public.whatsapp_conversations, public.whatsapp_messages from anon, authenticated;
grant select on table public.commerce_connections, public.integration_events,
  public.whatsapp_connections, public.whatsapp_contacts,
  public.whatsapp_conversations, public.whatsapp_messages to authenticated;

create policy "members read commerce connections" on public.commerce_connections
  for select to authenticated using (private.is_store_member(store_id));
create policy "members read integration events" on public.integration_events
  for select to authenticated using (store_id is not null and private.is_store_member(store_id));
create policy "members read whatsapp connections" on public.whatsapp_connections
  for select to authenticated using (private.is_store_member(store_id));
create policy "members read whatsapp contacts" on public.whatsapp_contacts
  for select to authenticated using (private.is_store_member(store_id));
create policy "members read whatsapp conversations" on public.whatsapp_conversations
  for select to authenticated using (private.is_store_member(store_id));
create policy "members read whatsapp messages" on public.whatsapp_messages
  for select to authenticated using (private.is_store_member(store_id));

comment on schema private is 'Server-only credentials and short-lived authorization state. Never expose through browser clients.';
comment on table public.integration_events is 'Idempotent webhook inbox. Persist only safe payload metadata; keep raw sensitive payloads out of browser-readable tables.';
