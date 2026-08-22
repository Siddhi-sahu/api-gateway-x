import express from "express"
import userRoutes from './routes/user.routes'

const app = express()
const PORT = 3000;

app.use(express.json())

app.use("/api/user", userRoutes)

app.listen(PORT, ()=>{
    console.log(`Server running on ${PORT}`)
})