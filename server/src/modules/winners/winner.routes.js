import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth.js";
import { requireActiveSubscriptionForSubscriber } from "../../middleware/subscription.js";
import {
  getAllWinnersAdmin,
  getMyWinners,
  putMyWinnerProof,
  reviewWinnerAdmin,
} from "./winner.controller.js";

const router = Router();

router.use(authenticate);

router.get(
  "/me",
  requireRole("subscriber", "admin"),
  requireActiveSubscriptionForSubscriber,
  getMyWinners,
);
router.put(
  "/me/:winnerId/proof",
  requireRole("subscriber", "admin"),
  requireActiveSubscriptionForSubscriber,
  putMyWinnerProof,
);

router.get("/admin/all", requireRole("admin"), getAllWinnersAdmin);
router.put("/admin/:winnerId/review", requireRole("admin"), reviewWinnerAdmin);

export default router;
