import { Router } from "express";
import { getUsers } from "../controllers/user.controller.js";
import { serviceKeyMiddleware } from "../middleware/service-key.js";

const router = Router()
router.get("/",serviceKeyMiddleware, getUsers);


export default router;