import dotenv from "dotenv"
dotenv.config();

import express from "express"
import cors from "cors";
import userRoutes from './routes/user.routes.js'
import productRoutes from './routes/product.routes.js'
import { ratelimiter } from "./middlewares/ratelimiter.js"

const app = express()
app.use(cors());
app.use(express.json())

app.use(ratelimiter);

app.use("/api/auth", userRoutes);
// 2. Proxied, Protected Route down to User Service
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);


const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    console.log(`Server running on ${PORT}`)
})