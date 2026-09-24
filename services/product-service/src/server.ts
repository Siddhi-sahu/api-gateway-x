import express from "express"
import productRoutes from "./routes/product.routes.js"
import { serviceKeyMiddleware } from "./middleware/service-key.js"
import { pool } from "./config/database.js"

const app = express()
const PORT = 3002

app.use(express.json())

app.use("/products", serviceKeyMiddleware, productRoutes);

app.get("/health", async (_req, res) => {
    try {
        await pool.query("SELECT 1");

        return res.status(200).json({
            status: "healthy",
            service: "user-service"
        });
    } catch {
        return res.status(503).json({
            status: "unhealthy",
            service: "user-service"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`)
} )