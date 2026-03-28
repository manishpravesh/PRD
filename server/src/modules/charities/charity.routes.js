import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth.js";
import {
  getMyDonations,
  getMyPreference,
  getCharities,
  getCharity,
  postMyDonation,
  postCharity,
  putMyPreference,
  putCharity,
  removeCharity,
} from "./charity.controller.js";

const router = Router();

router.get("/", getCharities);

router.get(
  "/me/preference",
  authenticate,
  requireRole("subscriber", "admin"),
  getMyPreference,
);
router.put(
  "/me/preference",
  authenticate,
  requireRole("subscriber", "admin"),
  putMyPreference,
);
router.get(
  "/me/donations",
  authenticate,
  requireRole("subscriber", "admin"),
  getMyDonations,
);
router.post(
  "/me/donations",
  authenticate,
  requireRole("subscriber", "admin"),
  postMyDonation,
);

router.get("/:charityId", getCharity);

router.post("/", authenticate, requireRole("admin"), postCharity);
router.put("/:charityId", authenticate, requireRole("admin"), putCharity);
router.delete("/:charityId", authenticate, requireRole("admin"), removeCharity);

export default router;
