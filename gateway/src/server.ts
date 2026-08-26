import dotenv from "dotenv"
dotenv.config();

import express from "express"
import userRoutes from './routes/user.routes.js'
import productRoutes from './routes/product.routes.js'
import authRoutes from './routes/auth.routes.js'

const app = express()
const PORT = process.env.PORT || 3000;

app.use(express.json())

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);


app.listen(PORT, ()=>{
    console.log(`Server running on ${PORT}`)
})