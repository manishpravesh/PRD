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

## Current status

- Part 1 (Project Foundation) completed.
- Part 2 (Database Schema and Seed Data) completed.
- Part 3 (Authentication and Access Control) in progress.

## API (current)

- `GET /health` public server health
- `GET /api/v1/` public API root
- `GET /api/v1/auth/me` requires Supabase bearer token
- `GET /api/v1/admin/health` requires authenticated admin role
- `GET /api/v1/subscriber/health` requires authenticated subscriber/admin and active subscription
