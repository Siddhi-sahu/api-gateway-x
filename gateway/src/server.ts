import express from "express"
import userRoutes from './routes/user.routes.js'

const app = express()
const PORT = 3000;

app.use(express.json())

app.use("/api/user", userRoutes);
console.log("1");

app.listen(PORT, ()=>{
    console.log(`Server running on ${PORT}`)
})