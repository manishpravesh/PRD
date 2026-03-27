# Supabase Folder

This folder contains database migrations, row-level security policies, and seed data.

## Layout

- `migrations` - versioned SQL schema and policy files
- `seed` - seed data for local/staging QA

Detailed schema implementation starts in Part 2.

## Part 2 Status

Part 2 is implemented with:

- `migrations/20260327_001_init_schema.sql`
- `seed/seed.sql`

## Run Migrations and Seed

Using Supabase SQL editor (quickest):

1. Run `migrations/20260327_001_init_schema.sql`
2. Run `seed/seed.sql`

Using Supabase CLI (if configured):

1. `supabase db push`
2. `supabase db reset --linked`

Note: `profiles.auth_user_id` links to `auth.users.id` but is nullable, so seed data works before auth records are wired in Part 3.
