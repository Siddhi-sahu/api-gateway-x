import express from "express"
import userRoutes from './routes/user.routes.js'
import productRoutes from './routes/product.routes.js'

const app = express()
const PORT = 3000;

app.use(express.json())

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);


app.listen(PORT, ()=>{
    console.log(`Server running on ${PORT}`)
})