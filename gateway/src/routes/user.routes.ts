import { Router } from "express";
import { getUserService } from "../controllers/user.controller.js";

const router = Router()

//need to route to user service, axios?
router.get("/", getUserService);

export default router;