# Relod project memory

Updated: 21 September 2026

## Product

Relod is an Arabic-first return decision layer for Saudi ecommerce merchants. A merchant provides a written return policy, AI proposes structured rules with their source clauses, and the merchant reviews and publishes them. Customer eligibility is then decided by deterministic code using the published rules and verified order facts. AI never decides eligibility.

The three outcomes are `ELIGIBLE`, `NOT_ELIGIBLE`, and `MANUAL_REVIEW`. Every decision must preserve the policy version, order facts, applied rules, reason codes, and evaluation time. Published versions and past decisions are immutable.

## MVP outcome

One merchant can connect one Salla store, turn a real policy into approved rules, let a verified customer request a return on the web or WhatsApp, receive a deterministic answer, and inspect the resulting case and evidence. Refunds, shipping labels, exchanges, multiple commerce platforms, and autonomous AI decisions are later work.

## Ownership

- Mirza: product and engineering.
- Yazeed: merchant relationships, real policies and scenarios, pilot coordination, sales, partnerships, and fundraising.
- First pilot: connect the merchant privately, test controlled orders with staff, then expose the flow to customers.

## Technology

- Next.js 16, React 19, TypeScript, Tailwind/shadcn, Bun.
- Supabase Auth, Postgres, RLS, and Edge Functions.
- Vercel production app.
- Salla OAuth with read-only order scope.
- Ollama Cloud / DeepSeek V4.1 Flash for policy extraction.
- Meta WhatsApp Cloud API is the planned customer channel.

## Completed

- Responsive bilingual English/Arabic UI with persisted RTL/LTR switching and light/dark themes.
- Supabase email magic-link and Google authentication.
- Merchant workspace, policies, cases, settings, landing page, and customer return screens.
- Deterministic domain engine, policy snapshots, decision evidence model, case state model, and demo fixtures.
- Supabase MVP schema with tenant-scoped RLS, immutable policy/decision tables, integration tables, and WhatsApp conversation tables.
- Salla OAuth install/callback, encrypted credentials, connection check, disconnect, and signed webhook intake.
- Salla integration UI with truthful connection state and official logo.
- New Policy UI translated to Arabic and redesigned with readable rule labels, source disclosure, and explicit merchant actions.
- Settings simplified so only real controls remain; store-name updates enforce role permissions and validation.

## Current implementation boundary

- Salla authorization is real, but the original customer return flow still uses local fixture orders until the live order functions are deployed and wired.
- The original policy extraction returns sample rules; real Ollama extraction is the current build task.
- Policy list/review and merchant case screens still contain local-service paths that must be replaced with Supabase-backed data for the pilot.
- The Salla webhook currently records events and handles uninstall/revocation; it does not synchronize full orders.
- WhatsApp database tables exist, but inbound webhook handling and the conversation state machine are not implemented yet.
- Never describe fixture or simulated behavior as a successful live integration.

## Security and product rules

- Keep all provider tokens and model keys in Supabase secrets. Never expose them with `NEXT_PUBLIC_` or commit them.
- Store credentials encrypted at rest and scope all merchant reads/writes by store membership.
- Public order verification must resist order enumeration and return the same generic error for wrong order/customer combinations.
- Rate-limit public verification, return only sanitized facts, and re-validate signed facts on the server before saving a decision.
- Salla access tokens expire; refresh tokens are single-use. Refresh must be serialized and the newly returned refresh token must replace the previous one atomically.
- AI output is always an unpublished proposal. Merchant approval is required before a rule can be used.
- Missing required facts produce `MANUAL_REVIEW`; the engine never guesses.

## Immediate sequence

1. Real Ollama policy extraction, Supabase drafts, merchant review, and immutable publishing.
2. Salla token renewal, real order lookup/items, customer ownership verification, and normalized order facts.
3. Server-side eligibility evaluation and saved decision/case evidence.
4. Controlled end-to-end test with Yazeed's Salla demo store.
5. Invite one merchant for a private pilot.
6. Build WhatsApp webhook and conversation flow over the same Salla and policy services.

## Required server secrets

Supabase Edge Function secrets: `OLLAMA_API_KEY`, `SALLA_CLIENT_ID`, `SALLA_CLIENT_SECRET`, `SALLA_REDIRECT_URI`, `SALLA_WEBHOOK_SECRET`, `INTEGRATION_ENCRYPTION_KEY`, `APP_URL`, and Supabase server credentials. Vercel needs only the public Supabase URL/key and app URL; provider secrets stay in Supabase.

## Validation expectations

Run TypeScript checks, production build, focused browser checks in English/Arabic and mobile/desktop, and controlled API tests. Before the real merchant pilot, prove: Salla authorization, refresh, valid order verification, invalid verifier rejection, three decision outcomes, immutable policy version evidence, persisted cases, and safe failure behavior.
