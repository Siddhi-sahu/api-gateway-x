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
import axios from "axios";

const app = express()
app.use(cors());
app.use(express.json())

app.use(ratelimiter);
app.use(requestId);
app.use(requestLogger)

// app.get("/health", async (_req, res) => {
//     // const redisHealthy = await check redis
//     const userService = await axios.get(userServiceUrl!)

//     res.json({
//         gateway: "healthy",
//         // redis: redisHealthy ? "healthy" : "unhealthy"
//     });
// });

app.use("/api/auth", authUserRoutes);
// 2. Proxied, Protected Route down to User Service
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);

app.get("/metrics", (_req, res) => {
    res.json(metrics);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    console.log(`Server running on ${PORT}`)
})