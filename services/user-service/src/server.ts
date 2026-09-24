import express from "express"
import serviceRoutes from './routes/service.routes.js'
import authRoutes from "./routes/auth.routes.js"
import { pool } from "./config/database.js"

const app = express()
const PORT = 3001

app.use(express.json())

app.use("/users", serviceRoutes);
app.use("/users/auth", authRoutes);
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