import express from "express"
import serviceRoutes from './routes/service.routes.js'
import authRoutes from "./routes/auth.routes.js"

const app = express()
const PORT = 3001

app.use(express.json())

app.use("/users", serviceRoutes);
app.use("/users/auth", authRoutes);

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`)
} )