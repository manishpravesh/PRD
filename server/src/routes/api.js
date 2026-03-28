import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";
import subscriptionRoutes from "../modules/subscriptions/subscription.routes.js";
import scoreRoutes from "../modules/scores/score.routes.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/subscription.js";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    message: "Golf Charity Platform API is running",
    version: "v1",
  });
});

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/scores", scoreRoutes);

router.get(
  "/subscriber/health",
  authenticate,
  requireRole("subscriber", "admin"),
  requireActiveSubscription,
  (_req, res) => {
    res.status(200).json({
      ok: true,
      message: "Subscriber route access granted with active subscription",
    });
  },
);

export default router;
