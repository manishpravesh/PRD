import { env } from "../../config/env.js";
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
  const requestedRole = String(req.body?.role || "subscriber").toLowerCase();
  const fullName = String(req.body?.fullName || "").trim();
  const adminCode = String(req.body?.adminCode || "");

  if (!["subscriber", "admin"].includes(requestedRole)) {
    throw new HttpError(400, "Role must be subscriber or admin");
  }

  if (requestedRole === "admin") {
    if (!env.adminSignupCode) {
      throw new HttpError(403, "Admin signup is disabled");
    }

    if (adminCode !== env.adminSignupCode) {
      throw new HttpError(403, "Invalid admin signup code");
    }
  }

  if (!req.auth.user?.email) {
    throw new HttpError(400, "Authenticated user email is required");
  }

  const profile = await upsertProfileForAuthUser({
    authUserId: req.auth.user.id,
    email: req.auth.user.email,
    fullName,
    role: requestedRole,
  });

  res.status(200).json({
    ok: true,
    data: {
      profile,
    },
  });
});
