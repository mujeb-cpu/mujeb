create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  timezone text not null default 'Asia/Riyadh',
  currency text not null default 'SAR' check (currency = 'SAR'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);
create index memberships_user_id_idx on public.memberships(user_id);

create table public.policy_drafts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  source_text text not null,
  rules jsonb not null default '[]'::jsonb,
  extraction_state text not null default 'idle' check (extraction_state in ('idle', 'reading', 'proposing', 'ready', 'failed')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index policy_drafts_store_id_idx on public.policy_drafts(store_id);

create table public.policy_versions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  version_label text not null,
  source_text text not null,
  rules_snapshot jsonb not null,
  published_by uuid not null references auth.users(id),
  published_at timestamptz not null default now(),
  unique (store_id, version_label)
);
create index policy_versions_store_id_idx on public.policy_versions(store_id);

create table public.eligibility_decisions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  policy_version_id uuid not null references public.policy_versions(id) on delete restrict,
  order_id text not null,
  outcome text not null check (outcome in ('ELIGIBLE', 'NOT_ELIGIBLE', 'MANUAL_REVIEW')),
  reason_codes text[] not null default '{}',
  order_facts_snapshot jsonb not null,
  policy_snapshot jsonb not null,
  evaluated_at timestamptz not null default now()
);
create index eligibility_decisions_store_id_idx on public.eligibility_decisions(store_id);
create index eligibility_decisions_order_id_idx on public.eligibility_decisions(store_id, order_id);

create table public.return_cases (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  decision_id uuid not null references public.eligibility_decisions(id) on delete restrict,
  order_id text not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'AWAITING_ITEM', 'RECEIVED', 'RESOLVED', 'CANCELLED')),
  customer_snapshot jsonb not null,
  item_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index return_cases_store_id_idx on public.return_cases(store_id);
create index return_cases_status_idx on public.return_cases(store_id, status);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  actor_user_id uuid references auth.users(id),
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_events_store_id_idx on public.audit_events(store_id, created_at desc);

create function private.is_store_member(target_store_id uuid)
returns boolean language sql security definer set search_path = '' stable
as $$
  select exists (
    select 1 from public.memberships
    where store_id = target_store_id and user_id = (select auth.uid())
  );
$$;

create function private.has_store_role(target_store_id uuid, allowed_roles text[])
returns boolean language sql security definer set search_path = '' stable
as $$
  select exists (
    select 1 from public.memberships
    where store_id = target_store_id
      and user_id = (select auth.uid())
      and role = any(allowed_roles)
  );
$$;

revoke all on function private.is_store_member(uuid) from public;
revoke all on function private.has_store_role(uuid, text[]) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_store_member(uuid) to authenticated;
grant execute on function private.has_store_role(uuid, text[]) to authenticated;

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  new_store_id uuid;
  requested_store_name text;
begin
  requested_store_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'store_name'), ''), 'My Store');
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''));
  insert into public.stores (name) values (requested_store_name) returning id into new_store_id;
  insert into public.memberships (store_id, user_id, role) values (new_store_id, new.id, 'owner');
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.memberships enable row level security;
alter table public.policy_drafts enable row level security;
alter table public.policy_versions enable row level security;
alter table public.eligibility_decisions enable row level security;
alter table public.return_cases enable row level security;
alter table public.audit_events enable row level security;

revoke all on table public.profiles, public.stores, public.memberships,
  public.policy_drafts, public.policy_versions, public.eligibility_decisions,
  public.return_cases, public.audit_events from anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, update on public.stores to authenticated;
grant select on public.memberships to authenticated;
grant select, insert, update, delete on public.policy_drafts to authenticated;
grant select on public.policy_versions, public.eligibility_decisions, public.return_cases, public.audit_events to authenticated;

create policy "users read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "users update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "members read stores" on public.stores for select to authenticated using (private.is_store_member(id));
create policy "admins update stores" on public.stores for update to authenticated
  using (private.has_store_role(id, array['owner', 'admin'])) with check (private.has_store_role(id, array['owner', 'admin']));
create policy "members read memberships" on public.memberships for select to authenticated using (private.is_store_member(store_id));
create policy "members read drafts" on public.policy_drafts for select to authenticated using (private.is_store_member(store_id));
create policy "members create drafts" on public.policy_drafts for insert to authenticated
  with check (private.is_store_member(store_id) and created_by = (select auth.uid()));
create policy "members update drafts" on public.policy_drafts for update to authenticated
  using (private.is_store_member(store_id)) with check (private.is_store_member(store_id));
create policy "admins delete drafts" on public.policy_drafts for delete to authenticated
  using (private.has_store_role(store_id, array['owner', 'admin']));
create policy "members read policy versions" on public.policy_versions for select to authenticated using (private.is_store_member(store_id));
create policy "members read decisions" on public.eligibility_decisions for select to authenticated using (private.is_store_member(store_id));
create policy "members read cases" on public.return_cases for select to authenticated using (private.is_store_member(store_id));
create policy "members read audit events" on public.audit_events for select to authenticated using (private.is_store_member(store_id));

comment on table public.policy_versions is 'Immutable published policy snapshots. Writes must go through trusted server code.';
comment on table public.eligibility_decisions is 'Immutable decision evidence. Browser clients have read-only access.';
comment on table public.audit_events is 'Append-only audit history. Browser clients have read-only access.';
