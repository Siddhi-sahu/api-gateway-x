import express from "express"
import productRoutes from "./routes/product.routes.js"

const app = express()
const PORT = 3002

app.use(express.json())

app.use("/products", productRoutes);


app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`)
} )