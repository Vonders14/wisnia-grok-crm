# wisnia-grok-crm

Read-only rebuild of Devon McKenney’s internal Wisnia CRM tabs: **Opps**, **Deals**, **Accounts**, and **Contacts**.

The legacy app is a single ~40k-line HTML file that talked to Supabase with a **service_role key in the browser**. This repo replaces that surface with a typed React app, mock fixtures for local/CI work, and a server-side read-only proxy design for when real credentials exist.

> **Hard rule:** this version never writes to Supabase. No migrations, no schema changes, no PATCH/POST/DELETE against tables, no `fn_add_master_column`. Fixtures are clearly fake (`*.example.test`, “Fake Investor N”).

## Quick start (no credentials)

```bash
npm install
npm run dev          # http://localhost:5173 — mock data
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright (starts Vite)
npm run build
```

Default data mode is `mock` (`VITE_DATA_MODE=mock`). Nothing calls a real Supabase project.

## Architecture

| Layer | Choice | Why |
|---|---|---|
| UI | React 19 + TypeScript + Vite | Matches the SPEC’s SPA target; fast local loop |
| Routing | React Router | `/opps`, `/deals`, `/accounts`, `/contacts` + record pages |
| Data fetching | TanStack Query | Cache + pagination for large opp sets |
| Grid | Shared `DataGrid` (TanStack Virtual) | One windowed grid for all four tabs |
| Data access | `CrmDataClient` interface | `MockCrmClient` for dev/CI; `SupabaseReadonlyClient` for real reads |
| Styling | **Attio-style visual system** (Inter, white/light-gray, blue accent) | Mockup in `docs/attio-mockup-reference.html` is the design spec. Attio is visual reference only — no Attio integration |
| Proxy | `server/proxy.mjs` | Keeps privileged keys off the browser; GET + allowlisted read RPCs only |

```
src/
  app/           shell + router
  data/          types, fixtures, mock + supabase-readonly clients
  features/      opps, deals, prospects (accounts/contacts), records
  grid/          shared virtualized DataGrid
  lib/           business rules (heat/score/health/email scope), data-contract, filters, paging
server/
  proxy.mjs      optional read-only API in front of Supabase
```

Opps use **server-side pagination** in the data client (`limit`/`offset`) so a future 57k-row live dataset is not loaded into the browser in one shot. The mock dataset is intentionally small (~120 opps) but exercises the same paging/filter API.

## What’s built (read-only)

- **Opps:** filter rail, heat nav, seeded saved-view presets, exact `Interested` filter, health/heat/score columns, side panel with email/tasks/calls (read), pagination
- **Deals:** grid, status filter, campaign rollup counts, drawer with investors / tasks / timeline / data-room file list (read). Investor counts load from opps even if Deals is opened first (fixes the original bug)
- **Accounts / Contacts:** `crm_prospect_page`-shaped paging API, search, paste-list (consumer domains ignored), deal targeting UI, keyword sweep (read), row drawer, record pages
- **Shared:** Cmd/Ctrl-K search modal, record routes, read-only banner, disabled “coming soon” controls for every write action from the original

## What’s stubbed (UI present, disabled)

Edit cell, mark dead, notes, tasks create, saved-view write, sequence push, mass email / send, create opps, data-room upload / re-index, Run Prompt, Apollo save/reveal, Sync D365, Kanban, AI draft.

The data layer exposes **no write methods**.

## Secure setup for real Supabase (later)

1. **Never** put `service_role` in `VITE_*` or the browser.
2. Copy `.env.example` → `.env` (git-ignored).
3. Recommended path until RLS is approved:
   - Run `npm run dev:proxy` with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (server only).
   - Set `VITE_DATA_MODE=supabase` and `VITE_API_BASE_URL=http://localhost:8787`.
   - The proxy only allows GET list/detail endpoints and read RPCs: `crm_prospect_page`, `crm_keyword_sweep_exact`, `crm_campaigns`.
4. Longer-term (needs Devon’s approval): anon key + read-only RLS for an allow-listed user; drop the service key entirely.
5. Make this GitHub repo **private** before any real connection details or customer-shaped data land here.

## Business rules ported

Heat/score/urgency mapping, health labels, exact interest match, dead-row hiding (`is_dead !== true`), email-thread scoping, sequence status-bump eligibility, consumer-domain paste handling, website → `http://www.{host}`, prospect footer/`SHOW_ALL_MAX` helpers. Covered by Vitest.

## Decisions needed from Devon

1. Make the repo private.
2. Approve RLS vs keep the server proxy.
3. Confirm data-room folder naming: code uses `"<name> (<id>)"` (Storage rejects `[ ]`).
4. Whether outbound “Send” needs an extra confirm when writes return.
5. Whether notes should stay browser-local or move server-side (would need a table — out of scope until approved).

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite on mock data |
| `npm run dev:proxy` | Read-only Supabase proxy |
| `npm run lint` | oxlint |
| `npm run typecheck` | `tsc -b` |
| `npm run test` | Vitest |
| `npm run test:e2e` | Playwright |
| `npm run build` | Production bundle |
| `npm run ci` | lint + typecheck + unit + build + e2e |

CI: `.github/workflows/ci.yml` on PRs and `main`.
