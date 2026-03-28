import { supabaseAdmin } from "../../config/supabase.js";
import { HttpError } from "../../utils/http.js";

function randomUniqueNumbers(count, min, max) {
  const bag = new Set();
  while (bag.size < count) {
    bag.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }

  return Array.from(bag);
}

function countMatches(userNumbers, winningNumbers) {
  const winSet = new Set(winningNumbers);
  return userNumbers.reduce(
    (acc, value) => (winSet.has(value) ? acc + 1 : acc),
    0,
  );
}

async function getEligibleEntries(drawId) {
  const { data, error } = await supabaseAdmin
    .from("draw_entries")
    .select("user_id")
    .eq("draw_id", drawId)
    .eq("eligible", true);

  if (error) {
    throw new Error(`Unable to fetch draw entries: ${error.message}`);
  }

  return data;
}

async function getUserLatestScores(userId) {
  const { data, error } = await supabaseAdmin
    .from("golf_scores")
    .select("score")
    .eq("user_id", userId)
    .order("score_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(`Unable to fetch user scores: ${error.message}`);
  }

  return data.map((x) => x.score);
}

export async function listDraws({
  includeDraft = false,
  forAdmin = false,
} = {}) {
  let query = supabaseAdmin
    .from("draws")
    .select(
      "id, draw_month, mode, status, winning_numbers, active_subscribers_count, total_pool_inr, jackpot_rollover_inr, published_at",
    )
    .order("draw_month", { ascending: false });

  if (!forAdmin && !includeDraft) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Unable to list draws: ${error.message}`);
  }

  return data;
}

export async function createDraw({ drawMonth, mode, createdBy }) {
  if (!drawMonth) {
    throw new HttpError(400, "drawMonth is required in YYYY-MM-DD format");
  }

  const selectedMode = mode === "algorithmic" ? "algorithmic" : "random";
  const winningNumbers = randomUniqueNumbers(5, 1, 45);

  const { data, error } = await supabaseAdmin
    .from("draws")
    .insert({
      draw_month: drawMonth,
      mode: selectedMode,
      status: "draft",
      winning_numbers: winningNumbers,
      created_by: createdBy,
    })
    .select("id, draw_month, mode, status, winning_numbers")
    .single();

  if (error) {
    throw new Error(`Unable to create draw: ${error.message}`);
  }

  return data;
}

export async function runDrawSimulation(drawId, adminProfileId) {
  const { data: draw, error: drawError } = await supabaseAdmin
    .from("draws")
    .select("id, mode, winning_numbers")
    .eq("id", drawId)
    .maybeSingle();

  if (drawError) throw new Error(`Unable to fetch draw: ${drawError.message}`);
  if (!draw) throw new HttpError(404, "Draw not found");

  const simulatedNumbers =
    draw.mode === "random"
      ? randomUniqueNumbers(5, 1, 45)
      : draw.winning_numbers;
  const entries = await getEligibleEntries(drawId);

  const result = {
    totalEntries: entries.length,
    winnersByTier: { 5: 0, 4: 0, 3: 0 },
  };

  for (const entry of entries) {
    const scores = await getUserLatestScores(entry.user_id);
    const matches = countMatches(scores, simulatedNumbers);
    if (matches === 5 || matches === 4 || matches === 3) {
      result.winnersByTier[String(matches)] += 1;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("draw_simulations")
    .insert({
      draw_id: drawId,
      simulated_numbers: simulatedNumbers,
      mode: draw.mode,
      result_snapshot: result,
      created_by: adminProfileId,
    })
    .select("id, draw_id, simulated_numbers, result_snapshot, created_at")
    .single();

  if (error) throw new Error(`Unable to store simulation: ${error.message}`);

  await supabaseAdmin
    .from("draws")
    .update({ status: "simulated" })
    .eq("id", drawId);
  return data;
}

function getTierPercents() {
  return {
    5: 0.4,
    4: 0.35,
    3: 0.25,
  };
}

export async function publishDraw(drawId, adminProfileId) {
  const { data: draw, error: drawError } = await supabaseAdmin
    .from("draws")
    .select("id, winning_numbers, total_pool_inr, jackpot_rollover_inr")
    .eq("id", drawId)
    .maybeSingle();

  if (drawError)
    throw new Error(`Unable to load draw for publish: ${drawError.message}`);
  if (!draw) throw new HttpError(404, "Draw not found");

  const entries = await getEligibleEntries(drawId);
  const winners = { 5: [], 4: [], 3: [] };

  for (const entry of entries) {
    const scores = await getUserLatestScores(entry.user_id);
    const matches = countMatches(scores, draw.winning_numbers);
    if (matches === 5 || matches === 4 || matches === 3) {
      winners[matches].push(entry.user_id);
    }
  }

  const pool = Number(draw.total_pool_inr || 0);
  const jackpot = Number(draw.jackpot_rollover_inr || 0);
  const percents = getTierPercents();

  const tierAmounts = {
    5: Math.floor(pool * percents[5]) + jackpot,
    4: Math.floor(pool * percents[4]),
    3: Math.floor(pool * percents[3]),
  };

  for (const tier of [5, 4, 3]) {
    const ids = winners[tier];
    const winnerCount = ids.length;

    if (winnerCount === 0) {
      await supabaseAdmin.from("draw_pool_tiers").upsert(
        {
          draw_id: drawId,
          match_count: tier,
          pool_share_percent: percents[tier] * 100,
          pool_amount_inr: tierAmounts[tier],
          rollover_from_previous_inr: tier === 5 ? jackpot : 0,
        },
        { onConflict: "draw_id,match_count" },
      );
      continue;
    }

    const eachPrize = Math.floor(tierAmounts[tier] / winnerCount);
    for (const userId of ids) {
      await supabaseAdmin.from("winners").upsert(
        {
          draw_id: drawId,
          user_id: userId,
          match_count: tier,
          prize_inr: eachPrize,
          verification_status: "pending",
          payment_status: "pending",
        },
        { onConflict: "draw_id,user_id,match_count" },
      );
    }

    await supabaseAdmin.from("draw_pool_tiers").upsert(
      {
        draw_id: drawId,
        match_count: tier,
        pool_share_percent: percents[tier] * 100,
        pool_amount_inr: tierAmounts[tier],
        rollover_from_previous_inr: tier === 5 ? jackpot : 0,
      },
      { onConflict: "draw_id,match_count" },
    );
  }

  const nextJackpot = winners[5].length === 0 ? tierAmounts[5] : 0;
  const { error: updateError } = await supabaseAdmin
    .from("draws")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      jackpot_rollover_inr: nextJackpot,
      created_by: adminProfileId,
    })
    .eq("id", drawId);

  if (updateError)
    throw new Error(`Unable to publish draw: ${updateError.message}`);

  return {
    drawId,
    winners,
    jackpotRolloverForNextMonth: nextJackpot,
  };
}
