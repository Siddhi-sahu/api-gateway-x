import type { Response } from "express";
import { AuthRequest } from "../types/index.js";
import { pool } from "../config/database.js";

const userServiceKey = process.env.SERVICE_API_KEY;
if(!userServiceKey){
    throw new Error("SERVICE_API_KEY is not defined");  
}

export async function getUsers(req: AuthRequest, res: Response){
    const userId = req.headers["x-auth-user-id"];
    console.log(userId);
    const serviceKey = req.headers["x-service-Key"];

    if(!serviceKey || serviceKey !== userServiceKey){
        return res.status(401).json({
        message: "Invalid service credentials or missing headersss."
    });
    }

    try{
        const queryText = 'SELECT * FROM users'
        const result = await pool.query(queryText);
        console.log(result);

        return res.status(200).json(result.rows);

    }catch(e){
        console.log(e);
        return res.status(500).json({ error: "User Service Error" });

    }
};
