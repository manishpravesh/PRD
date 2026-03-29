# Supabase Folder

This folder contains database migrations, row-level security policies, and seed data.

## Layout

- `migrations` - versioned SQL schema and policy files
- `seed` - seed data for local/staging QA

## Fast Setup (Supabase Dashboard)

Use this path when Supabase CLI is not installed.

1. Create a new Supabase project.
2. Open SQL Editor and run:
   - `migrations/20260327_001_init_schema.sql`
3. For staging/local QA, run:
   - `seed/seed.sql`
4. Open Authentication -> Users and create test users for emails used in seed:
   - `admin@platform.com`
   - `golfer1@test.com`
   - `golfer2@test.com`
5. In SQL Editor, link seeded profiles to created auth users:

```sql
update public.profiles p
set auth_user_id = u.id
from auth.users u
where lower(u.email) = lower(p.email)
  and p.auth_user_id is null;
```

6. Verify mapping:

```sql
select p.id, p.email, p.role, p.auth_user_id
from public.profiles p
order by p.created_at;
```

Without this mapping, authenticated API calls will fail with "Profile not found for authenticated user".

## Required Project Settings

- Authentication provider: Email enabled
- URL settings:
  - Site URL should match frontend URL
  - Add frontend URL in redirect URLs for login flows

## Environment Values to Copy

From Supabase project settings, copy to `.env` using `.env.example` template:

- `SUPABASE_URL` = Project URL
- `SUPABASE_ANON_KEY` = anon public key
- `SUPABASE_SERVICE_ROLE_KEY` = service role key
- `VITE_SUPABASE_URL` = Project URL
- `VITE_SUPABASE_ANON_KEY` = anon public key

## CLI Path (Optional)

If Supabase CLI is installed and linked:

1. `supabase db push`
2. `supabase db reset --linked`

Note: `profiles.auth_user_id` references `auth.users.id`. Seed data intentionally inserts profiles first, then links auth users after they are created.
