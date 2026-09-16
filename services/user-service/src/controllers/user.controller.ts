import type { Response } from "express";
import { AuthRequest } from "../types/index.js";
import { pool } from "../config/database.js";

export async function getUsers(req: AuthRequest, res: Response){
    //user id is trusted becuase we have jwt verification at gateway level
    const userId = req.headers["x-auth-user-id"];
    console.log(userId);
    console.log("User Service received request");

    try{
        const queryText = 'SELECT * FROM users'
        const result = await pool.query(queryText);
        console.log(result.rows);

        return res.status(200).json(result.rows);
    }catch(e){
        console.log(e);
        return res.status(500).json({ error: "User Service Error" });

    }
};
