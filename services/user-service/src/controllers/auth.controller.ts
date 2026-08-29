import type { Response } from "express";
import { AuthRequest } from "../types/index.js";
import { pool } from "../config/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"


const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
};

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


export async function login(req: AuthRequest, res: Response){
    try{
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Missing fields" });
        };
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "invalid credentials" });
        };

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: "invalid credentials" });
        };
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            JWT_SECRET!,
            { expiresIn: "14d" }
        );

        return res.status(200).json({ message: "Login successful", token });

    }catch(e){
        return res.status(500).json({ error: "Internal server error" });
    } 
}