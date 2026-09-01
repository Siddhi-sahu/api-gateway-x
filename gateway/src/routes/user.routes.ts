import { Router } from "express";
import { getUserService, } from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = Router()

router.get("/", verifyToken ,getUserService);

export default router;