import type { Response } from "express";
import { AuthRequest } from "../types/index.js";
import { pool } from "../config/database.js";

export async function getUsers(req: AuthRequest, res: Response){
    try{
        const UserId = req.headers["x-user-id"];
        const UserName = req.headers["x-user-name"];
        const UserEmail = req.headers["x-user-email"];
        
        const usersResponse = {
            authenticatedUser: {
                id: UserId || "unknown",
                name: UserName || "Guest",
                email: UserEmail || "No Email"
            },
            allUsers: [
                { "id": 1, "name": "Himani" },
                { "id": 2, "name": "Siddhi", "email": "abc@gmail.com" }
            ] //change it to actual users, from db? but db connection is in /gateway, is the solution to move the db connection to root?
        };
        return res.status(200).json(usersResponse);

    }catch(e){
        console.log(e);
        return res.status(500).json({ error: "User Service Error" });

    }
};
