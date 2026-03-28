import { asyncHandler } from "../../utils/http.js";
import { supabaseAdmin } from "../../config/supabase.js";

export const getAdminAnalytics = asyncHandler(async (_req, res) => {
  const [profilesRes, poolRes, charityRes, drawsRes] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("draws").select("total_pool_inr"),
    supabaseAdmin.from("charity_contributions").select("contribution_inr"),
    supabaseAdmin.from("draws").select("id, status, draw_month").order("draw_month", { ascending: false }).limit(12),
  ]);

  const totalUsers = profilesRes.count ?? 0;
  const totalPrizePool = (poolRes.data ?? []).reduce((sum, item) => sum + Number(item.total_pool_inr || 0), 0);
  const totalCharityContribution = (charityRes.data ?? []).reduce(
    (sum, item) => sum + Number(item.contribution_inr || 0),
    0,
  );

  res.status(200).json({
    ok: true,
    data: {
      totalUsers,
      totalPrizePool,
      totalCharityContribution,
      recentDraws: drawsRes.data ?? [],
    },
  });
});
