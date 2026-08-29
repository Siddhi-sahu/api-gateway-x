import express from "express"
import serviceRoutes from './routes/service.routes.js'
import authRoutes from "./routes/auth.routes.js"

const app = express()
const PORT = 3001

app.use(express.json())

app.use("/users", serviceRoutes);
app.use("/auth", authRoutes);



// app.get("/users/:id", async(req, res) => {
//     const id = req.params.id;

//     res.status(200).json({})
// })

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`)
} )