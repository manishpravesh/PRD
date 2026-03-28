import { supabaseAdmin } from "../../config/supabase.js";
import { HttpError } from "../../utils/http.js";

export async function listMyWinners(profileId) {
  const { data, error } = await supabaseAdmin
    .from("winners")
    .select(
      "id, draw_id, match_count, prize_inr, verification_status, payment_status, proof_file_path, created_at",
    )
    .eq("user_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to fetch winner records: ${error.message}`);
  }

  return data;
}

export async function listAllWinners() {
  const { data, error } = await supabaseAdmin
    .from("winners")
    .select(
      "id, draw_id, user_id, match_count, prize_inr, verification_status, payment_status, proof_file_path, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to fetch winners: ${error.message}`);
  }

  return data;
}

export async function uploadWinnerProof(profileId, winnerId, proofFilePath) {
  if (!proofFilePath || typeof proofFilePath !== "string") {
    throw new HttpError(400, "proofFilePath is required");
  }

  const { data: winner, error: lookupError } = await supabaseAdmin
    .from("winners")
    .select("id, user_id")
    .eq("id", winnerId)
    .maybeSingle();

  if (lookupError)
    throw new Error(`Unable to fetch winner: ${lookupError.message}`);
  if (!winner) throw new HttpError(404, "Winner record not found");
  if (winner.user_id !== profileId)
    throw new HttpError(403, "You can upload proof only for your own record");

  const { data, error } = await supabaseAdmin
    .from("winners")
    .update({ proof_file_path: proofFilePath, verification_status: "pending" })
    .eq("id", winnerId)
    .select(
      "id, proof_file_path, verification_status, payment_status, updated_at",
    )
    .single();

  if (error) throw new Error(`Unable to update winner proof: ${error.message}`);
  return data;
}

export async function reviewWinner({
  winnerId,
  action,
  rejectionReason,
  adminProfileId,
}) {
  const allowed = ["approve", "reject", "mark-paid"];
  if (!allowed.includes(action)) {
    throw new HttpError(400, "action must be approve, reject, or mark-paid");
  }

  const { data: winner, error: lookupError } = await supabaseAdmin
    .from("winners")
    .select("id, verification_status, payment_status")
    .eq("id", winnerId)
    .maybeSingle();

  if (lookupError)
    throw new Error(`Unable to fetch winner record: ${lookupError.message}`);
  if (!winner) throw new HttpError(404, "Winner record not found");

  let payload = {};
  if (action === "approve") {
    payload = {
      verification_status: "approved",
      rejection_reason: null,
      verified_by: adminProfileId,
    };
  }

  if (action === "reject") {
    payload = {
      verification_status: "rejected",
      rejection_reason: rejectionReason
        ? String(rejectionReason)
        : "Rejected by admin",
      verified_by: adminProfileId,
    };
  }

  if (action === "mark-paid") {
    if (winner.verification_status !== "approved") {
      throw new HttpError(400, "Winner must be approved before payout");
    }

    payload = {
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      verified_by: adminProfileId,
    };
  }

  const { data, error } = await supabaseAdmin
    .from("winners")
    .update(payload)
    .eq("id", winnerId)
    .select(
      "id, verification_status, payment_status, rejection_reason, paid_at, updated_at",
    )
    .single();

  if (error) throw new Error(`Unable to review winner: ${error.message}`);
  return data;
}
