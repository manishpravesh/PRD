import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { bootstrapProfile, getMe } from "./auth.controller.js";

const router = Router();

router.get("/me", authenticate, getMe);
router.post("/bootstrap", authenticate, bootstrapProfile);

export default router;
