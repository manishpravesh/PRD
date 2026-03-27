-- Part 2: Seed data for local and staging evaluation

truncate table
  public.audit_logs,
  public.independent_donations,
  public.charity_contributions,
  public.winners,
  public.draw_simulations,
  public.draw_entries,
  public.draw_pool_tiers,
  public.draws,
  public.golf_scores,
  public.subscription_transactions,
  public.subscriptions,
  public.user_charity_preferences,
  public.charities,
  public.profiles
restart identity cascade;

insert into public.profiles (id, email, full_name, role, country_code, timezone)
values
  ('11111111-1111-1111-1111-111111111111', 'admin@platform.com', 'Platform Admin', 'admin', 'IN', 'Asia/Kolkata'),
  ('22222222-2222-2222-2222-222222222222', 'golfer1@test.com', 'John Golfer', 'subscriber', 'IN', 'Asia/Kolkata'),
  ('33333333-3333-3333-3333-333333333333', 'golfer2@test.com', 'Sarah Charity', 'subscriber', 'IN', 'Asia/Kolkata'),
  ('44444444-4444-4444-4444-444444444444', 'golfer3@test.com', 'Lucky Player', 'subscriber', 'IN', 'Asia/Kolkata'),
  ('55555555-5555-5555-5555-555555555555', 'golfer4@test.com', 'Premium User', 'subscriber', 'IN', 'Asia/Kolkata'),
  ('66666666-6666-6666-6666-666666666666', 'golfer5@test.com', 'Bob Inactive', 'subscriber', 'IN', 'Asia/Kolkata'),
  ('77777777-7777-7777-7777-777777777777', 'golfer6@test.com', 'Jane Expired', 'subscriber', 'IN', 'Asia/Kolkata');

insert into public.charities (id, name, description, website_url, is_featured)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Water Aid', 'Clean water and sanitation programs across underserved regions.', 'https://www.wateraid.org', true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Cancer Research UK', 'Research and treatment support for cancer prevention and recovery.', 'https://www.cancerresearchuk.org', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'WWF', 'Conservation work to protect wildlife and natural habitats.', 'https://www.worldwildlife.org', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'Oxfam', 'Poverty reduction and emergency response support globally.', 'https://www.oxfam.org', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'Save the Children', 'Education and wellbeing programs for children worldwide.', 'https://www.savethechildren.net', false);

insert into public.user_charity_preferences (user_id, charity_id, contribution_percent, is_primary)
values
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 10.00, true),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 15.00, true),
  ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 10.00, true),
  ('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 20.00, true),
  ('66666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 10.00, true),
  ('77777777-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 10.00, true);

insert into public.subscriptions (
  id,
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  plan,
  status,
  amount_inr,
  charity_percent,
  current_period_start,
  current_period_end,
  canceled_at
)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '22222222-2222-2222-2222-222222222222', 'cus_test_001', 'sub_test_001', 'monthly', 'active', 999, 10.00, '2026-03-01', '2026-04-01', null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '33333333-3333-3333-3333-333333333333', 'cus_test_002', 'sub_test_002', 'yearly', 'active', 9999, 15.00, '2026-03-01', '2027-03-01', null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '44444444-4444-4444-4444-444444444444', 'cus_test_003', 'sub_test_003', 'monthly', 'active', 999, 10.00, '2026-03-05', '2026-04-05', null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', '55555555-5555-5555-5555-555555555555', 'cus_test_004', 'sub_test_004', 'yearly', 'active', 9999, 20.00, '2026-03-10', '2027-03-10', null),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', '66666666-6666-6666-6666-666666666666', 'cus_test_005', 'sub_test_005', 'monthly', 'canceled', 999, 10.00, '2026-02-01', '2026-03-01', '2026-02-20'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6', '77777777-7777-7777-7777-777777777777', 'cus_test_006', 'sub_test_006', 'monthly', 'lapsed', 999, 10.00, '2026-01-26', '2026-02-26', null);

insert into public.golf_scores (user_id, score, score_date)
values
  ('22222222-2222-2222-2222-222222222222', 35, '2026-03-10'),
  ('22222222-2222-2222-2222-222222222222', 32, '2026-03-12'),
  ('22222222-2222-2222-2222-222222222222', 38, '2026-03-15'),
  ('22222222-2222-2222-2222-222222222222', 34, '2026-03-18'),
  ('22222222-2222-2222-2222-222222222222', 36, '2026-03-20'),

  ('33333333-3333-3333-3333-333333333333', 40, '2026-03-10'),
  ('33333333-3333-3333-3333-333333333333', 39, '2026-03-12'),
  ('33333333-3333-3333-3333-333333333333', 41, '2026-03-14'),
  ('33333333-3333-3333-3333-333333333333', 38, '2026-03-16'),
  ('33333333-3333-3333-3333-333333333333', 42, '2026-03-19'),

  ('44444444-4444-4444-4444-444444444444', 33, '2026-03-09'),
  ('44444444-4444-4444-4444-444444444444', 31, '2026-03-11'),
  ('44444444-4444-4444-4444-444444444444', 32, '2026-03-13'),
  ('44444444-4444-4444-4444-444444444444', 30, '2026-03-17'),
  ('44444444-4444-4444-4444-444444444444', 34, '2026-03-21'),

  ('55555555-5555-5555-5555-555555555555', 45, '2026-03-05'),
  ('55555555-5555-5555-5555-555555555555', 44, '2026-03-08'),
  ('55555555-5555-5555-5555-555555555555', 45, '2026-03-13'),
  ('55555555-5555-5555-5555-555555555555', 43, '2026-03-18'),
  ('55555555-5555-5555-5555-555555555555', 44, '2026-03-22');

insert into public.draws (
  id,
  draw_month,
  mode,
  status,
  winning_numbers,
  active_subscribers_count,
  total_pool_inr,
  jackpot_rollover_inr,
  published_at,
  created_by
)
values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', '2026-02-01', 'random', 'published', '{5,18,22,39,44}', 4, 4000, 0, '2026-02-28 20:00:00+05:30', '11111111-1111-1111-1111-111111111111'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', '2026-03-01', 'random', 'published', '{12,28,7,41,33}', 4, 4000, 0, '2026-03-31 20:00:00+05:30', '11111111-1111-1111-1111-111111111111'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', '2026-04-01', 'algorithmic', 'simulated', '{14,22,31,39,44}', 4, 4000, 0, null, '11111111-1111-1111-1111-111111111111');

insert into public.draw_pool_tiers (draw_id, match_count, pool_share_percent, pool_amount_inr, rollover_from_previous_inr)
values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 5, 40.00, 1600, 0),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 4, 35.00, 1400, 0),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 3, 25.00, 1000, 0),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 5, 40.00, 1600, 0),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 4, 35.00, 1400, 0),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', 3, 25.00, 1000, 0);

insert into public.draw_entries (draw_id, user_id, eligible)
values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', '22222222-2222-2222-2222-222222222222', true),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', '33333333-3333-3333-3333-333333333333', true),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', '44444444-4444-4444-4444-444444444444', true),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', '55555555-5555-5555-5555-555555555555', true),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', '22222222-2222-2222-2222-222222222222', true),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', '33333333-3333-3333-3333-333333333333', true),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', '44444444-4444-4444-4444-444444444444', true),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', '55555555-5555-5555-5555-555555555555', true);

insert into public.draw_simulations (draw_id, simulated_numbers, mode, result_snapshot, created_by)
values
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    '{14,22,31,39,44}',
    'algorithmic',
    '{"summary":{"eligibleUsers":4,"winnersByTier":{"5":0,"4":1,"3":1}}}'::jsonb,
    '11111111-1111-1111-1111-111111111111'
  );

insert into public.winners (
  draw_id,
  user_id,
  match_count,
  prize_inr,
  verification_status,
  payment_status,
  proof_file_path,
  verified_by,
  paid_at
)
values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', '44444444-4444-4444-4444-444444444444', 5, 1600, 'pending', 'pending', 'winner-proofs/4444-march.png', null, null),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', '55555555-5555-5555-5555-555555555555', 4, 1400, 'approved', 'paid', 'winner-proofs/5555-march.png', '11111111-1111-1111-1111-111111111111', '2026-03-25 10:00:00+05:30'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', '22222222-2222-2222-2222-222222222222', 3, 1000, 'approved', 'processing', 'winner-proofs/2222-march.png', '11111111-1111-1111-1111-111111111111', null);

insert into public.charity_contributions (user_id, charity_id, subscription_id, contribution_inr, contribution_date)
values
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 100, '2026-03-01'),
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 1500, '2026-03-01'),
  ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 100, '2026-03-05'),
  ('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 2000, '2026-03-10');

insert into public.independent_donations (user_id, charity_id, amount_inr, stripe_payment_intent_id, status)
values
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 500, 'pi_test_001', 'succeeded'),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 250, 'pi_test_002', 'succeeded');

insert into public.audit_logs (actor_profile_id, entity_type, entity_id, action, details)
values
  ('11111111-1111-1111-1111-111111111111', 'draw', 'cccccccc-cccc-cccc-cccc-ccccccccccc2', 'publish', '{"note":"March draw published"}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', 'winner', null, 'verify', '{"approvedCount":2,"pendingCount":1}'::jsonb);
