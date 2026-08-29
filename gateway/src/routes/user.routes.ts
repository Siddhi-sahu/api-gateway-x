import { Router } from "express";
import { getUserService, userLogin, userRegister } from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = Router()

router.get("/", verifyToken ,getUserService);
router.post("/register", userRegister);
router.post("/login", userLogin);

export default router;