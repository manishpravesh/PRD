import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { getMe } from "./auth.controller.js";

const router = Router();

router.get("/me", authenticate, getMe);

export default router;
