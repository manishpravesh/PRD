import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth.js";
import {
  getAllDrawsAdmin,
  getPublishedDraws,
  postDraw,
  publishDrawController,
  simulateDraw,
} from "./draw.controller.js";

const router = Router();

router.get("/", getPublishedDraws);

router.get("/admin/all", authenticate, requireRole("admin"), getAllDrawsAdmin);
router.post("/", authenticate, requireRole("admin"), postDraw);
router.post("/:drawId/simulate", authenticate, requireRole("admin"), simulateDraw);
router.post("/:drawId/publish", authenticate, requireRole("admin"), publishDrawController);

export default router;
