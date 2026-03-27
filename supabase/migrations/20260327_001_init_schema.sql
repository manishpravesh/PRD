-- Part 2: Initial schema, constraints, and RLS policies

create extension if not exists pgcrypto;

create type public.user_role as enum ('public', 'subscriber', 'admin');
create type public.subscription_plan as enum ('monthly', 'yearly');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'lapsed');
create type public.draw_mode as enum ('random', 'algorithmic');
create type public.draw_status as enum ('draft', 'simulated', 'published', 'completed');
create type public.verification_status as enum ('pending', 'approved', 'rejected');
create type public.payout_status as enum ('pending', 'processing', 'paid', 'failed');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  email text not null unique,
  full_name text,
  role public.user_role not null default 'subscriber',
  country_code text not null default 'IN',
  timezone text not null default 'Asia/Kolkata',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  logo_url text,
  banner_url text,
  website_url text,
  country_code text not null default 'IN',
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_charity_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  charity_id uuid not null references public.charities (id) on delete restrict,
  contribution_percent numeric(5,2) not null default 10.00 check (contribution_percent >= 10 and contribution_percent <= 100),
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, charity_id)
);

create unique index uq_user_primary_charity on public.user_charity_preferences (user_id) where is_primary = true;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  plan public.subscription_plan not null,
  status public.subscription_status not null default 'trialing',
  amount_inr integer not null check (amount_inr > 0),
  charity_percent numeric(5,2) not null default 10.00 check (charity_percent >= 10 and charity_percent <= 100),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_user_status on public.subscriptions (user_id, status);

create table public.subscription_transactions (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  stripe_event_id text unique,
  transaction_type text not null,
  amount_inr integer not null check (amount_inr >= 0),
  status text not null,
  created_at timestamptz not null default now()
);

create table public.golf_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  score integer not null check (score between 1 and 45),
  score_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_golf_scores_user_date on public.golf_scores (user_id, score_date desc, created_at desc);

create table public.draws (
  id uuid primary key default gen_random_uuid(),
  draw_month date not null,
  mode public.draw_mode not null default 'random',
  status public.draw_status not null default 'draft',
  winning_numbers integer[] not null,
  active_subscribers_count integer not null default 0 check (active_subscribers_count >= 0),
  total_pool_inr integer not null default 0 check (total_pool_inr >= 0),
  jackpot_rollover_inr integer not null default 0 check (jackpot_rollover_inr >= 0),
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (draw_month)
);

create table public.draw_pool_tiers (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws (id) on delete cascade,
  match_count integer not null check (match_count in (3, 4, 5)),
  pool_share_percent numeric(5,2) not null check (pool_share_percent >= 0 and pool_share_percent <= 100),
  pool_amount_inr integer not null default 0 check (pool_amount_inr >= 0),
  rollover_from_previous_inr integer not null default 0 check (rollover_from_previous_inr >= 0),
  created_at timestamptz not null default now(),
  unique (draw_id, match_count)
);

create table public.draw_entries (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  eligible boolean not null default true,
  created_at timestamptz not null default now(),
  unique (draw_id, user_id)
);

create table public.draw_simulations (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws (id) on delete cascade,
  simulated_numbers integer[] not null,
  mode public.draw_mode not null,
  result_snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.winners (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  match_count integer not null check (match_count in (3, 4, 5)),
  prize_inr integer not null check (prize_inr >= 0),
  verification_status public.verification_status not null default 'pending',
  proof_file_path text,
  payment_status public.payout_status not null default 'pending',
  rejection_reason text,
  verified_by uuid references public.profiles (id) on delete set null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (draw_id, user_id, match_count)
);

create table public.charity_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  charity_id uuid not null references public.charities (id) on delete restrict,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  contribution_inr integer not null check (contribution_inr >= 0),
  contribution_date date not null,
  created_at timestamptz not null default now()
);

create index idx_charity_contributions_lookup on public.charity_contributions (charity_id, contribution_date desc);

create table public.independent_donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  charity_id uuid not null references public.charities (id) on delete restrict,
  amount_inr integer not null check (amount_inr > 0),
  stripe_payment_intent_id text unique,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles (id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);
create index idx_audit_logs_created_at on public.audit_logs (created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  );
$$;

create or replace function public.trim_user_scores()
returns trigger
language plpgsql
as $$
begin
  delete from public.golf_scores gs
  where gs.id in (
    select id
    from public.golf_scores
    where user_id = new.user_id
    order by score_date desc, created_at desc
    offset 5
  );

  return null;
end;
$$;

create trigger trg_profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger trg_charities_touch_updated_at
before update on public.charities
for each row execute function public.touch_updated_at();

create trigger trg_user_charity_preferences_touch_updated_at
before update on public.user_charity_preferences
for each row execute function public.touch_updated_at();

create trigger trg_subscriptions_touch_updated_at
before update on public.subscriptions
for each row execute function public.touch_updated_at();

create trigger trg_scores_touch_updated_at
before update on public.golf_scores
for each row execute function public.touch_updated_at();

create trigger trg_draws_touch_updated_at
before update on public.draws
for each row execute function public.touch_updated_at();

create trigger trg_winners_touch_updated_at
before update on public.winners
for each row execute function public.touch_updated_at();

create trigger trg_independent_donations_touch_updated_at
before update on public.independent_donations
for each row execute function public.touch_updated_at();

create trigger trg_trim_user_scores
after insert on public.golf_scores
for each row execute function public.trim_user_scores();

alter table public.profiles enable row level security;
alter table public.charities enable row level security;
alter table public.user_charity_preferences enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_transactions enable row level security;
alter table public.golf_scores enable row level security;
alter table public.draws enable row level security;
alter table public.draw_pool_tiers enable row level security;
alter table public.draw_entries enable row level security;
alter table public.draw_simulations enable row level security;
alter table public.winners enable row level security;
alter table public.charity_contributions enable row level security;
alter table public.independent_donations enable row level security;
alter table public.audit_logs enable row level security;

grant execute on function public.current_profile_id() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

create policy profiles_select_self_or_admin on public.profiles
for select
using (id = public.current_profile_id() or public.is_admin());

create policy profiles_insert_self_or_admin on public.profiles
for insert
with check (auth_user_id = auth.uid() or public.is_admin());

create policy profiles_update_self_or_admin on public.profiles
for update
using (id = public.current_profile_id() or public.is_admin())
with check (id = public.current_profile_id() or public.is_admin());

create policy charities_select_all on public.charities
for select
using (true);

create policy charities_modify_admin on public.charities
for all
using (public.is_admin())
with check (public.is_admin());

create policy user_charity_preferences_select on public.user_charity_preferences
for select
using (user_id = public.current_profile_id() or public.is_admin());

create policy user_charity_preferences_modify on public.user_charity_preferences
for all
using (user_id = public.current_profile_id() or public.is_admin())
with check (user_id = public.current_profile_id() or public.is_admin());

create policy subscriptions_select on public.subscriptions
for select
using (user_id = public.current_profile_id() or public.is_admin());

create policy subscriptions_modify on public.subscriptions
for all
using (user_id = public.current_profile_id() or public.is_admin())
with check (user_id = public.current_profile_id() or public.is_admin());

create policy subscription_transactions_select on public.subscription_transactions
for select
using (
  public.is_admin() or exists (
    select 1
    from public.subscriptions s
    where s.id = subscription_id
      and s.user_id = public.current_profile_id()
  )
);

create policy subscription_transactions_modify_admin on public.subscription_transactions
for all
using (public.is_admin())
with check (public.is_admin());

create policy golf_scores_select on public.golf_scores
for select
using (user_id = public.current_profile_id() or public.is_admin());

create policy golf_scores_modify on public.golf_scores
for all
using (user_id = public.current_profile_id() or public.is_admin())
with check (user_id = public.current_profile_id() or public.is_admin());

create policy draws_select on public.draws
for select
using (status = 'published' or public.is_admin());

create policy draws_modify_admin on public.draws
for all
using (public.is_admin())
with check (public.is_admin());

create policy draw_pool_tiers_select on public.draw_pool_tiers
for select
using (
  public.is_admin() or exists (
    select 1
    from public.draws d
    where d.id = draw_id
      and d.status = 'published'
  )
);

create policy draw_pool_tiers_modify_admin on public.draw_pool_tiers
for all
using (public.is_admin())
with check (public.is_admin());

create policy draw_entries_select on public.draw_entries
for select
using (user_id = public.current_profile_id() or public.is_admin());

create policy draw_entries_modify_admin on public.draw_entries
for all
using (public.is_admin())
with check (public.is_admin());

create policy draw_simulations_admin_only on public.draw_simulations
for all
using (public.is_admin())
with check (public.is_admin());

create policy winners_select on public.winners
for select
using (user_id = public.current_profile_id() or public.is_admin());

create policy winners_modify_admin on public.winners
for all
using (public.is_admin())
with check (public.is_admin());

create policy charity_contributions_select on public.charity_contributions
for select
using (user_id = public.current_profile_id() or public.is_admin());

create policy charity_contributions_modify_admin on public.charity_contributions
for all
using (public.is_admin())
with check (public.is_admin());

create policy independent_donations_select on public.independent_donations
for select
using (user_id = public.current_profile_id() or public.is_admin());

create policy independent_donations_modify on public.independent_donations
for all
using (user_id = public.current_profile_id() or public.is_admin())
with check (user_id = public.current_profile_id() or public.is_admin());

create policy audit_logs_select_admin on public.audit_logs
for select
using (public.is_admin());

create policy audit_logs_insert_self_or_admin on public.audit_logs
for insert
with check (actor_profile_id = public.current_profile_id() or public.is_admin());
