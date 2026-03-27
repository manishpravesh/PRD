import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth.js";

const router = Router();

router.get("/health", authenticate, requireRole("admin"), (_req, res) => {
  res.status(200).json({
    ok: true,
    message: "Admin route access granted",
  });
});

export default router;
