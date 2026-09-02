import { Router } from "express";
import { addProductService, getProductService } from "../controllers/product.controller.js";

const router = Router()

router.get("/", getProductService);
router.post("/", addProductService);

export default router;