# Environment Variable Matrix

## Frontend (Vite)

| Variable               | Local    | Staging  | Production | Purpose                           |
| ---------------------- | -------- | -------- | ---------- | --------------------------------- |
| VITE_API_BASE_URL      | Required | Required | Required   | Backend base URL for API requests |
| VITE_SUPABASE_URL      | Required | Required | Required   | Supabase project URL              |
| VITE_SUPABASE_ANON_KEY | Required | Required | Required   | Supabase public anonymous key     |

## Backend (Node/Express)

| Variable                  | Local    | Staging  | Production | Purpose                             |
| ------------------------- | -------- | -------- | ---------- | ----------------------------------- |
| NODE_ENV                  | Required | Required | Required   | Runtime mode                        |
| PORT                      | Required | Required | Required   | Server port                         |
| APP_ORIGIN                | Required | Required | Required   | Allowed frontend origin for CORS    |
| SUPABASE_URL              | Required | Required | Required   | Supabase project URL                |
| SUPABASE_ANON_KEY         | Required | Required | Required   | Used for token verification client  |
| SUPABASE_SERVICE_ROLE_KEY | Required | Required | Required   | Admin access for server operations  |
| STRIPE_SECRET_KEY         | Required | Required | Required   | Stripe server API key               |
| STRIPE_WEBHOOK_SECRET     | Required | Required | Required   | Stripe webhook signature validation |
| STRIPE_MONTHLY_PRICE_ID   | Required | Required | Required   | Stripe price id for monthly plan    |
| STRIPE_YEARLY_PRICE_ID    | Required | Required | Required   | Stripe price id for yearly plan     |
| STRIPE_SUCCESS_URL        | Required | Required | Required   | Redirect after successful checkout  |
| STRIPE_CANCEL_URL         | Required | Required | Required   | Redirect after cancelled checkout   |

## Example Local Frontend .env

VITE_API_BASE_URL=http://localhost:4000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

## Example Local Backend .env

NODE_ENV=development
PORT=4000
APP_ORIGIN=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_MONTHLY_PRICE_ID=price_monthly_xxx
STRIPE_YEARLY_PRICE_ID=price_yearly_xxx
STRIPE_SUCCESS_URL=http://localhost:5173/subscriber
STRIPE_CANCEL_URL=http://localhost:5173/subscriber

## Security Notes

- Never expose SUPABASE_SERVICE_ROLE_KEY to frontend
- Use separate Stripe keys for staging and production
- Rotate keys immediately if leaked
- Restrict APP_ORIGIN to exact frontend domain per environment
