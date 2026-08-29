import { Router } from "express";
import { getUsers } from "../controllers/user.controller.js";

const router = Router()

router.post("/", getUsers);


export default router;