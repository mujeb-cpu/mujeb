# Mujeeb context

Mujeeb serves Saudi ecommerce merchants with explainable, policy-based return eligibility. The current frontend iteration is English and left-to-right; Arabic-first localization remains future work.

## Product surfaces

- Public homepage: premium SaaS product story, scroll-aware navigation, explicit "For merchants / For customers" path split, policy-to-decision transformation flow, responsive calls to action, and curtain-reveal footer.
- Merchant workspace: overview control center, policy management with timeline and version history, return cases with filters and saved views, integrations with test connection, and grouped settings.
- Customer return flow: three-step Verify, Details, Answer with progress indicator, order verification, return details, deterministic eligibility answer, applied rule evidence, and request submission.

## Actors

- Merchant owner/admin: connects a store, creates policy drafts, approves rules, and publishes versions.
- Merchant operations: reviews manual cases, updates operational status, and adds notes.
- Customer: verifies order access, selects return details, and receives an explained decision.

## Domain boundaries

Eligibility outcomes are `ELIGIBLE`, `NOT_ELIGIBLE`, and `MANUAL_REVIEW`. Operational case statuses are separate: `OPEN`, `AWAITING_ITEM`, `RECEIVED`, `RESOLVED`, and `CANCELLED`.

A published policy version, relevant order facts, applied rules, reason codes, and evaluation time are frozen with each decision. Editing a policy creates a new draft/version. AI proposes rules; it does not approve, reject, publish, refund, or change inventory.

The customer result page displays the number and details of `appliedRules`; reason codes remain supporting evidence rather than the applied-rule count.

## Current UI direction

The design system uses Sora for display text, Manrope for body text, a restrained purple primary, saffron review states, green eligible states, and red not-eligible states. Cards, status badges, soft borders, generous spacing, and small purposeful motion are used consistently across public, merchant, and customer surfaces.

The merchant overview is structured as an operations control center: quick actions, needs-attention banner, KPI strip, recent activity, outcome distribution, policy health, and connection status.

The case list supports search, outcome filters, status filters, date filters (today, past 7 days, past 30 days), and saved views (default views plus custom user-saved views). Manual review cases with open status are highlighted with urgency indicators.

The case detail page puts the decision explanation first, followed by requested item data, evidence, timeline, operational status transitions, and internal notes.

The policy list shows a draft-to-published timeline (Draft to Review to Published), the current published version, a collapsible version history of all published versions, and draft review actions.

The integrations page shows connection cards with setup status, connected date, last sync timestamp, test connection button with latency result, and a useful empty state for unavailable platforms.

The settings page is grouped into store profile, return policy defaults (return window, auto-approve eligible, require photo), team access, notifications (new case, manual review, resolved, weekly digest), language, security, and account with demo reset.

The onboarding flow is four steps: store details, connect store, set up policy (with link to review published rules), and test a return (with link to the customer return flow and existing cases).

The homepage includes an explicit "For merchants / For customers" split section with two cards: one linking to the merchant workspace and one linking to the customer return flow, each with feature tags and distinct accent colors.

The customer flow uses a shared three-step indicator: Verify, Details, Answer. The final answer includes request details, applied policy rules, evidence metadata, and a clear next action.

## Pilot context

The demo uses Nova Store, a simulated Salla connection with last sync timestamp, Sara Ahmed, order SA-10492, and SAR amounts. Salla is the active demo platform; Zid is shown as coming later. The actual production pilot platform remains undecided.

## Production requirements

Before handling real merchant or customer data, add server-enforced customer order scope, merchant isolation, protected platform tokens, official OAuth scopes, rate limiting, audit logs, monitoring, backups, and production authentication.

## Verification status

The project builds successfully. Browser verification covered the customer return flow from verification through the result page, the corrected applied-rules count, the merchant overview, the cases list, and the policies list. The build reports only a bundle-size advisory; it does not prevent the application from building.
