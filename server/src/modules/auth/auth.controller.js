import { asyncHandler } from "../../utils/http.js";

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    ok: true,
    data: {
      user: {
        id: req.auth.user.id,
        email: req.auth.user.email,
      },
      profile: req.auth.profile,
    },
  });
});
