# Golf Charity Subscription Platform

Implementation based on the PRD for Digital Heroes trainee selection.

## Stack

- Frontend: React + Vite + JavaScript
- Backend: Node.js + Express
- Database/Auth/Storage: Supabase
- Billing: Stripe

## Workspace structure

- `app` - React frontend
- `server` - Express API services
- `supabase` - SQL migrations, RLS policies, and seed data
- `tests` - unit, integration, and e2e suites
- `docs` - architecture and delivery documentation

## Getting started

1. Install dependencies:
   - `npm install`
2. Copy environment template:
   - Create `.env` from `.env.example`
3. Start frontend:
   - `npm run dev:app`
4. Start backend:
   - `npm run dev:server`

## Frontend Auth + Routes

- Route pages:
  - `/` public dashboard
  - `/login` Supabase sign-in
  - `/subscriber` protected subscriber/admin page
  - `/admin` protected admin-only page
- Required frontend env vars:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_API_BASE_URL`

## Testing

Backend tests:

- `npm run test --workspace server`
- `npm run test:unit --workspace server`
- `npm run test:integration --workspace server`

## Current status

- Part 1 (Project Foundation) completed.
- Part 2 (Database Schema and Seed Data) completed.
- Part 3 (Authentication and Access Control) completed.
- Part 4/5/6 core backend modules completed (subscriptions, scores, charities, draws, winners, admin analytics).
- Frontend routed experience completed (public/subscriber/admin + Supabase session auth).
- Initial automated test harness completed (unit + integration baseline).

## API (current)

- `GET /health` public server health
- `GET /api/v1/` public API root
- `GET /api/v1/auth/me` requires Supabase bearer token
- `GET /api/v1/admin/health` requires authenticated admin role
- `GET /api/v1/subscriber/health` requires authenticated subscriber/admin and active subscription
- `GET /api/v1/subscriptions/status` requires authenticated subscriber/admin
- `POST /api/v1/subscriptions/checkout` requires authenticated subscriber/admin and body `{ "plan": "monthly" | "yearly" }`
- `POST /api/v1/subscriptions/cancel` requires authenticated subscriber/admin
- `POST /api/v1/subscriptions/webhook` Stripe webhook endpoint (raw body)
- `GET /api/v1/scores/latest` requires authenticated subscriber/admin, subscriber must have active subscription
- `POST /api/v1/scores` requires authenticated subscriber/admin, subscriber must have active subscription
- `PUT /api/v1/scores/:scoreId` requires authenticated subscriber/admin, subscriber must have active subscription
- `GET /api/v1/charities` public list/search (`?q=` and `?featured=true`)
- `GET /api/v1/charities/:charityId` public charity detail
- `GET /api/v1/charities/me/preference` subscriber/admin current selected charity preference
- `PUT /api/v1/charities/me/preference` subscriber/admin updates charity and contribution percentage
- `GET /api/v1/charities/me/donations` subscriber/admin independent donation history
- `POST /api/v1/charities/me/donations` subscriber/admin creates independent donation record
- `POST /api/v1/charities` admin creates charity
- `PUT /api/v1/charities/:charityId` admin updates charity
- `DELETE /api/v1/charities/:charityId` admin deletes charity
- `GET /api/v1/draws` public published draws
- `GET /api/v1/draws/admin/all` admin full draw list
- `POST /api/v1/draws` admin create draft draw
- `POST /api/v1/draws/:drawId/simulate` admin simulation run
- `POST /api/v1/draws/:drawId/publish` admin publish and create winners/tier pools
- `GET /api/v1/winners/me` subscriber/admin own winner records
- `PUT /api/v1/winners/me/:winnerId/proof` subscriber/admin upload proof path
- `GET /api/v1/winners/admin/all` admin winner management list
- `PUT /api/v1/winners/admin/:winnerId/review` admin approve/reject/mark-paid
- `GET /api/v1/admin/analytics` admin summary metrics

## Remaining for Production Hardening

- Full Stripe live-mode wiring and payout operations
- End-to-end browser tests for complete evaluator checklist
- Deployment to new Vercel and new Supabase project with live credentials
