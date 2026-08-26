import type { Request, Response } from "express";
import { generateToken } from "../middlewares/auth.js";
import { AuthRequest } from "../types/index.js";
import { pool } from "../config/database.js";
import bcrypt from "bcrypt";

export async function register(req: AuthRequest, res: Response){
    try{
        const {name, email, password} = req.body;
        if (!name || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
        };
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const queryText = `
        INSERT INTO users (name, email, password_hash) 
        VALUES ($1, $2, $3) 
        RETURNING id, name, email, created_at
        `;

        const result = await pool.query(queryText, [name, email, passwordHash]);
        const newUser = result.rows[0];
        return res.status(201).json({
        message: "User successfully registered at Gateway level",
        user: newUser
        });
        // const token = generateToken(userId);
        // if(!token){
        //     return res.json({"msg": "no auth token found."});
        // }

    }catch(error: any){
        if (error.code === '23505') {
        return res.status(400).json({ error: "Email already registered" });
        }
    
        console.error("Registration error:", error);
        return res.status(500).json({ error: "Internal server error" });
        
    } 
}

export async function login(req: Request, res: Response){
    try{

    }catch(e){
        console.log(e);
    } 
}