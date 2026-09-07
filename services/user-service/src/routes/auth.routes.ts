import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";
import { serviceKeyMiddleware } from "../middleware/service-key.js";

const router = Router()

router.post("/register", serviceKeyMiddleware, register);
router.post("/login", serviceKeyMiddleware, login);

export default router;