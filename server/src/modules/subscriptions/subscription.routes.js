import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth.js";
import {
  cancelSubscription,
  createSubscriptionCheckout,
  getSubscriptionStatus,
} from "./subscription.controller.js";

const router = Router();

router.use(authenticate);

router.get(
  "/status",
  requireRole("subscriber", "admin"),
  getSubscriptionStatus,
);
router.post(
  "/checkout",
  requireRole("subscriber", "admin"),
  createSubscriptionCheckout,
);
router.post("/cancel", requireRole("subscriber", "admin"), cancelSubscription);

export default router;
