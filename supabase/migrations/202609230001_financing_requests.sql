-- Financing requests captured from the landing page calculator.
--
-- The merchant's own numbers are stored alongside their contact details: the
-- estimate they were looking at when they asked is the basis of the request,
-- so it has to be part of the record rather than recomputed later from inputs
-- that may have since changed.

create table if not exists public.financing_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Contact
  store_name text not null,
  contact_name text not null,
  email text not null,
  phone text,

  -- The inputs behind the estimate
  monthly_returns integer not null,
  average_order_value numeric(12, 2) not null,
  processing_minutes integer not null,
  resolution_days numeric(5, 2) not null,
  hourly_cost numeric(10, 2) not null,

  -- The figures shown at the moment of submission
  tied_up_amount numeric(14, 2) not null,
  operating_cost numeric(14, 2) not null,

  locale text not null default 'en',
  status text not null default 'new',

  constraint financing_requests_email_format check (position('@' in email) > 1),
  constraint financing_requests_status_valid
    check (status in ('new', 'contacted', 'qualified', 'closed'))
);

create index if not exists financing_requests_created_at_idx
  on public.financing_requests (created_at desc);

alter table public.financing_requests enable row level security;

-- Anonymous visitors may submit a request and nothing else. There is
-- deliberately no select policy: submissions are read through the service role
-- only, so one merchant can never read another's figures or contact details.
create policy "anon can submit a financing request"
  on public.financing_requests
  for insert
  to anon, authenticated
  with check (true);
