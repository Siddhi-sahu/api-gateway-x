import { Router } from "express";
import { getUserService } from "../controllers/user.controller.js";

const router = Router()

router.get("/", getUserService);

export default router;