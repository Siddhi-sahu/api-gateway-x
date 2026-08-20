import express from "express"

const app = express()
const PORT = 3000;

app.use(express.json())

app.use("/api/user")

app.listen(PORT, ()=>{
    console.log(`Server running on ${PORT}`)
})