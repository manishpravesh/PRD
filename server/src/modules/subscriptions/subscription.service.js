import { supabaseAdmin } from "../../config/supabase.js";

const ACTIVE_STATUSES = ["active", "trialing"];

export async function hasActiveSubscription(profileId) {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id, status, current_period_end")
    .eq("user_id", profileId)
    .in("status", ACTIVE_STATUSES)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to verify subscription status: ${error.message}`);
  }

  return Boolean(data);
}
