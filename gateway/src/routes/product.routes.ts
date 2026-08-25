import { Router } from "express";
import { getProductService } from "../controllers/product.controller.js";

const router = Router()

router.get("/", getProductService);

export default router;