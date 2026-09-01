import type { Response } from "express";
import { AuthRequest } from "../types/index.js";
import { pool } from "../config/database.js";


export async function getUsers(req: AuthRequest, res: Response){
    console.log("iluilu")
    try{
        console.log("userhit")
        const queryText = 'SELECT * FROM users'
        const result = await pool.query(queryText);
        console.log(result);

        return res.status(200).json(result.rows);

    }catch(e){
        console.log(e);
        return res.status(500).json({ error: "User Service Error" });

    }
};
