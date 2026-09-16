# Mujeeb

Mujeeb is an explainable return-decision workspace for ecommerce merchants. Approved policy rules produce deterministic customer answers, while each decision keeps a readable evidence trail.

## What is included

### Public homepage

- Premium SaaS landing page with Sora and Manrope typography.
- Scroll-aware navigation that shrinks and hides on scroll.
- Clear "For merchants / For customers" path split section so visitors immediately understand which path is theirs.
- Editorial transformation flow from policy text to AI extraction, merchant approval, and customer decision.
- Responsive customer and merchant calls to action.
- Curtain-reveal footer with engraved Mujeeb branding.

### Merchant workspace

- Control-center overview with quick actions, KPI strip, needs-attention banner, recent activity, outcome distribution, policy health, and store connection status.
- Grouped sidebar navigation with breadcrumbs.
- Return case list with search, outcome filters, status filters, date filters (today, past 7 days, past 30 days), saved views (All, Needs review, Open, Resolved, plus custom), and urgency highlighting for manual reviews.
- Case detail page with the decision explanation as the centerpiece, applied rules with pass/fail indicators, frozen evidence, timeline, operational status transitions, and internal notes.
- Policy list with draft-to-published timeline (Draft to Review to Published), current version card, version history with all published versions, and draft review actions.
- Guided policy creation flow with paste, sample policy, simulated extraction, proposed rules, approval states, editing, and publication safeguards.
- Review and publish page that blocks unresolved rules and explains frozen published versions.
- Integration cards with connection status, last sync timestamp, test connection button with latency result, and useful empty state for unavailable platforms.
- Settings grouped into store profile, return policy defaults (window, auto-approve, photo requirement), team access, notifications (new case, manual review, resolved, weekly digest), language, security, and account with demo reset.

### Customer return flow

- Three-step Verify, Details, Answer experience with a shared progress indicator on every step.
- Order verification with demo helper and clear error state.
- Item, quantity, reason, and condition selection with mobile-first item cards.
- Eligibility result with outcome explanation, request details, applied rule count and full rule evidence, return deadline, and next action.
- Return request submission with confirmation and case ID.
- Customer shell branded for Nova Store and powered by Mujeeb.

### Auth and onboarding

- Demo sign in / create account screen.
- Four-step onboarding: store details, connect store, set up policy (with link to review rules), and test a return (with link to customer flow and existing cases).

## Domain behavior

Eligibility outcomes are `ELIGIBLE`, `NOT_ELIGIBLE`, and `MANUAL_REVIEW`. Operational case statuses are separate: `OPEN`, `AWAITING_ITEM`, `RECEIVED`, `RESOLVED`, and `CANCELLED`.

AI proposes policy rules; it does not approve, reject, publish, refund, or change inventory. Published policy versions, relevant facts, applied rules, reason codes, and evaluation times are frozen with each decision.

## Demo data

The demo uses Nova Store, a simulated Salla connection with last sync timestamp, Sara Ahmed, order `SA-10492`, and SAR amounts. Use the Demo helper on the customer return screen for seeded credentials. All data is synthetic and stored in the browser.

## Routes

- `/` public product story with merchant/customer split
- `/auth` demo sign in/create account
- `/onboarding` four-step store setup with guided return test
- `/app` merchant overview
- `/app/policies`, `/app/policies/new`, `/app/policies/review/:draftId`
- `/app/cases`, `/app/cases/:caseId`
- `/app/integrations`, `/app/settings`
- `/return`, `/return/details`, `/return/result`

## Technology

- Vite, React, and TypeScript
- React Router
- Tailwind CSS v4 and shadcn/ui primitives
- Local browser persistence for synthetic demo data
- Fontsource Sora and Manrope
- Lucide icons

## Production boundaries

Authentication, commerce connections, order verification, policy extraction, and persistence are browser-local demo behavior. Before handling real data, add server-enforced customer order scope, merchant isolation, protected platform tokens, official OAuth scopes, rate limiting, audit logs, monitoring, backups, and production authentication.

## Verification

The project builds successfully. Browser verification covered the customer return flow, applied rules count, merchant overview, cases list, and policies list.
