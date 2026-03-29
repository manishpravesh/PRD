# Go-Live Runbook

## Phase A: Staging Readiness

1. Apply database migration to staging Supabase
2. Optionally apply seed data to staging
3. Deploy backend to Render and set staging backend env vars
4. Deploy frontend and set staging frontend env vars
5. Configure Stripe staging webhook endpoint to staging backend
6. Execute smoke test script: scripts/smoke-test.ps1

Exit criteria:

- All smoke tests pass
- No blocker issues in core flows

## Phase B: Production Preparation

1. Create new production Supabase project
2. Apply migration only (no broad seed load)
3. Create production Stripe products/prices and collect price IDs
4. Set production backend env vars on Render
5. Set production frontend env vars
6. Configure production Stripe webhook endpoint

Exit criteria:

- Backend health and API root endpoints respond
- Stripe webhook signature verification working

## Phase C: Production Release

1. Deploy backend to production on Render
2. Deploy frontend to production
3. Run quick production smoke test
4. Verify auth login for subscriber and admin
5. Verify one test checkout end to end using Stripe test strategy appropriate for environment

Exit criteria:

- Public pages operational
- Subscriber dashboard operational
- Admin dashboard operational

## Phase D: Post-Release Monitoring (first 24 hours)

Track:

- 4xx/5xx backend responses
- Subscription webhook failures
- Draw publish errors
- Winner review operation failures

Actions:

- Fix and redeploy if critical flow breaks
- Keep rollback option ready for frontend and backend deployments

## Rollback Guidance

Frontend rollback:

- Redeploy previous stable frontend build

Backend rollback:

- Redeploy previous stable backend build
- If schema rollback is needed, use explicit reverse SQL script only

Important:

- Do not run destructive database commands in production without backup/export

## Handoff Package

Provide to evaluator/client:

- Frontend URL
- Backend URL
- Test subscriber credentials
- Test admin credentials
- This runbook and checklist documents
