import express from "express"

const app = express()
const PORT = 3001

app.use(express.json())

app.get("/users", async(req, res) => {
    console.log("hit users")
    res.status(200).json({
    "users": [
        {
        "id": 1,
        "name": "Himani"
        }
    ]
    })

})

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`)
} )