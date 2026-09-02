import type { Request, Response } from "express";
import { pool } from "../config/database.js";


export async function getProducts(req: Request, res: Response){
    console.log("iluilu")
    try{
        console.log("product hit")
        const queryText = 'SELECT * FROM products'
        const result = await pool.query(queryText);
        console.log(result.rows);

        return res.status(200).json(result.rows);

    }catch(e){
        console.log(e);
        return res.status(500).json({ error: e, msg: "product Service Error" });

    }
};

//admin should add products
export async function addProducts(req: Request, res: Response){
    console.log("iluilu2")
    const {name, price} = req.body;
        if (!name || !price) {
        return res.status(400).json({ error: "Missing required fields" });
        };
    try{
        const queryText = `
        INSERT INTO products (name, price) 
        VALUES ($1, $2) 
        RETURNING id, name, price, created_at
        `;

        const result = await pool.query(queryText, [name, price]);
        const newProduct = result.rows[0];
        return res.status(201).json({
        message: "prodcut successfully added.",
        productId: newProduct.id,
        });

    }catch(e){
        console.log(e);
        return res.status(500).json({ error: "product Service Error" });

    }
};