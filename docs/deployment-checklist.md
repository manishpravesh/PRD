# Deployment Checklist

## 1. Pre-deploy Validation

- Backend tests pass: npm --prefix server run test
- Frontend build passes: npm --prefix app run build
- Verify Supabase migration file applied in target project:
  - supabase/migrations/20260327_001_init_schema.sql
- Verify seed data strategy for target environment:
  - Use supabase/seed/seed.sql for staging only
  - Do not run seed file in production unless required

## 2. Accounts and Projects

- Create a new Vercel project for frontend app
- Create a new Render web service for backend API (from `render.yaml`)
- Create a new Supabase project for backend data/auth/storage
- Create Stripe products and prices for:
  - Monthly plan
  - Yearly plan
- Configure Stripe webhook endpoint to backend URL:
  - POST /api/v1/subscriptions/webhook

## 3. Environment Variables

Set all required variables for each environment. Reference:

- docs/environment-matrix.md

At minimum, ensure:

- VITE_API_BASE_URL
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_MONTHLY_PRICE_ID
- STRIPE_YEARLY_PRICE_ID
- STRIPE_SUCCESS_URL
- STRIPE_CANCEL_URL

## 4. Backend Verification

After deploy, verify:

- GET /health returns 200
- GET /api/v1 returns API payload
- Protected route rejects unauthenticated request:
  - GET /api/v1/admin/health returns 401
- APP_ORIGIN in backend env matches frontend domain

## 5. Stripe Verification

- Test checkout for monthly plan
- Test checkout for yearly plan
- Confirm webhook records subscription in database
- Confirm cancellation at period end updates local subscription state

## 6. Functional Smoke Validation

Run script:

- scripts/smoke-test.ps1

Or manually validate:

- Public charities list loads
- Published draws list loads
- Subscriber can add score
- Subscriber can update charity preference
- Subscriber can submit winner proof path
- Admin can create/simulate/publish draw
- Admin can review winner status

## 7. Final Handoff

- Share production URLs:
  - Frontend URL
  - Backend URL
- Share test credentials for:
  - Subscriber
  - Admin
- Share final documentation bundle:
  - docs/deployment-checklist.md
  - docs/environment-matrix.md
  - docs/go-live-runbook.md
