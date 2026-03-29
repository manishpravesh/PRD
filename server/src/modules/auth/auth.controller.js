import { upsertProfileForAuthUser } from "../../config/supabase.js";
import { asyncHandler, HttpError } from "../../utils/http.js";

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    ok: true,
    data: {
      user: {
        id: req.auth.user.id,
        email: req.auth.user.email,
      },
      profile: req.auth.profile,
      needsProfileSetup: !req.auth.profile,
    },
  });
});

export const bootstrapProfile = asyncHandler(async (req, res) => {
  const fullName = String(req.body?.fullName || "").trim();

  if (!req.auth.user?.email) {
    throw new HttpError(400, "Authenticated user email is required");
  }

  const profile = await upsertProfileForAuthUser({
    authUserId: req.auth.user.id,
    email: req.auth.user.email,
    fullName,
    role: "subscriber",
  });

  res.status(200).json({
    ok: true,
    data: {
      profile,
    },
  });
});
