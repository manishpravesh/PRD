# Golf Charity Platform - 9-Part Implementation Plan

## Part 1 - Project Foundation (in progress)

- Monorepo structure with `app`, `server`, `supabase`, `tests`, and `docs`
- Root workspace scripts and shared developer commands
- Base Express API server with health checks
- Environment templates for local and deployment setup
- Initial README and developer onboarding notes

## Part 2 - Database Schema and Policies

- Supabase schema migrations for all core entities
- Enums, constraints, indexes, and RLS policies
- Seed scripts with evaluator test data

## Part 3 - Authentication and Access Control

- Supabase Auth integration (JWT)
- Public/subscriber/admin route guard model
- Session handling and protected API middleware

## Part 4 - Subscription and Billing

- Stripe monthly/yearly products and checkout flow
- Webhooks for status sync and lifecycle states
- Access restriction for inactive/lapsed users

## Part 5 - Score Management

- Score CRUD with validation (1-45)
- Rolling latest-5 score retention logic
- User and admin score edit capabilities

## Part 6 - Draw and Prize Engine

- Monthly draw lifecycle with admin controls
- Random official draw execution
- Algorithmic simulation mode for admin preview
- Prize split (40/35/25) and rollover accounting

## Part 7 - Charity and Winner Verification

- Charity directory, profile, and featured modules
- User charity contribution controls and independent donation record
- Winner proof upload, admin verify/reject, payout status workflow

## Part 8 - Frontend Dashboards and UX

- Public landing and conversion flow
- Subscriber dashboard modules
- Admin dashboard operations and analytics cards
- Responsive and motion-enhanced UI

## Part 9 - Testing, Deployment, and Documentation

- Unit/integration/e2e test coverage against PRD checklist
- Fresh Vercel + Supabase deployment
- Runbook, architecture docs, and evaluator handoff docs
