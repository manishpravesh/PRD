import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth.js";
import { requireActiveSubscriptionForSubscriber } from "../../middleware/subscription.js";
import { addScore, editScore, getLatestScores } from "./score.controller.js";

const router = Router();

router.use(authenticate);
router.use(requireRole("subscriber", "admin"));
router.use(requireActiveSubscriptionForSubscriber);

router.get("/latest", getLatestScores);
router.post("/", addScore);
router.put("/:scoreId", editScore);

export default router;
