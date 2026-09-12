import { Router } from "express";
import { register, login, logout, getMe } from "../controllers/auth.controller";
import { authLimiter } from "../middleware/rate-limit.middleware";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);

export default router;
