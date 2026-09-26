import dotenv from "dotenv"
dotenv.config();

import express from "express"
import cors from "cors";
import userRoutes from './routes/user.routes.js'
import productRoutes from './routes/product.routes.js'
import { ratelimiter } from "./middlewares/ratelimiter.js"
import authUserRoutes from './routes/auth.user.routes.js'
import { requestId } from "./middlewares/requestId.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { metrics } from "./utils/metrics.js";
import healthRoutes from './routes/health.routes.js'

const app = express()
app.use(cors());
app.use(express.json())

app.use(ratelimiter);
app.use(requestId);
app.use(requestLogger)

app.use("/health", healthRoutes);

app.use("/api/auth", authUserRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);

app.get("/metrics", (_req, res) => {
    res.json(metrics);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    console.log(`Server running on ${PORT}`)
})