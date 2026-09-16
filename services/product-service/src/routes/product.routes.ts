import { Router } from "express";
import { addProducts, getProducts } from "../controllers/product.controller.js";
import { serviceKeyMiddleware } from "../middleware/service-key.js";

const router = Router();

router.get("/", serviceKeyMiddleware, getProducts);
router.post("/", serviceKeyMiddleware,addProducts);

export default router
