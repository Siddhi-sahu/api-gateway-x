import express from "express"

const app = express()
const PORT = 3002

app.use(express.json())

app.get("/products", async(req, res) => {
    const products = {
        "users": [
        {
        "id": 1,
        "name": "lip-gloss",
        "price": 900
        },
        {
        "id": 2,
        "name": "concelear",
        "price": 1900
        },
    ]
    };

    try{
        console.log("hit products")
        return res.status(200).json(products);

    }catch(e){
        console.log(e)

    }
    

});

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`)
} )