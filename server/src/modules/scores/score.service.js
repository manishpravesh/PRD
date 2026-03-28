import { supabaseAdmin } from "../../config/supabase.js";
import { HttpError } from "../../utils/http.js";

function normalizeScoreDate(scoreDate) {
  const parsed = new Date(scoreDate);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, "scoreDate must be a valid date");
  }

  return parsed.toISOString().slice(0, 10);
}

export function validateScorePayload({ score, scoreDate }) {
  const numericScore = Number(score);
  if (
    !Number.isInteger(numericScore) ||
    numericScore < 1 ||
    numericScore > 45
  ) {
    throw new HttpError(400, "score must be an integer between 1 and 45");
  }

  return {
    score: numericScore,
    scoreDate: normalizeScoreDate(scoreDate),
  };
}

export async function listLatestScores(profileId, limit = 5) {
  const { data, error } = await supabaseAdmin
    .from("golf_scores")
    .select("id, score, score_date, created_at, updated_at")
    .eq("user_id", profileId)
    .order("score_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Unable to list scores: ${error.message}`);
  }

  return data;
}

export async function createScore(profileId, payload) {
  const { score, scoreDate } = validateScorePayload(payload);

  const { data, error } = await supabaseAdmin
    .from("golf_scores")
    .insert({
      user_id: profileId,
      score,
      score_date: scoreDate,
    })
    .select("id, score, score_date, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Unable to create score: ${error.message}`);
  }

  return data;
}

export async function updateScore(profileId, scoreId, payload) {
  const { score, scoreDate } = validateScorePayload(payload);

  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("golf_scores")
    .select("id, user_id")
    .eq("id", scoreId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Unable to fetch score: ${lookupError.message}`);
  }

  if (!existing) {
    throw new HttpError(404, "Score not found");
  }

  if (existing.user_id !== profileId) {
    throw new HttpError(403, "You do not have permission to edit this score");
  }

  const { data, error } = await supabaseAdmin
    .from("golf_scores")
    .update({
      score,
      score_date: scoreDate,
    })
    .eq("id", scoreId)
    .select("id, score, score_date, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Unable to update score: ${error.message}`);
  }

  return data;
}
