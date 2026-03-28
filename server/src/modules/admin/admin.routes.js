import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth.js";
import { getAdminAnalytics } from "./admin.controller.js";

const router = Router();

router.get("/health", authenticate, requireRole("admin"), (_req, res) => {
  res.status(200).json({
    ok: true,
    message: "Admin route access granted",
  });
});

router.get("/analytics", authenticate, requireRole("admin"), getAdminAnalytics);

export default router;
