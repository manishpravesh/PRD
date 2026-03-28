import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth.js";
import {
  getCharities,
  getCharity,
  postCharity,
  putCharity,
  removeCharity,
} from "./charity.controller.js";

const router = Router();

router.get("/", getCharities);
router.get("/:charityId", getCharity);

router.post("/", authenticate, requireRole("admin"), postCharity);
router.put("/:charityId", authenticate, requireRole("admin"), putCharity);
router.delete("/:charityId", authenticate, requireRole("admin"), removeCharity);

export default router;
