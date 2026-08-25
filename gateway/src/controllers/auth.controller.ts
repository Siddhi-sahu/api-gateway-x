import type { Request, Response } from "express";
import { generateToken } from "../middlewares/auth.js";
import { AuthRequest } from "../types/index.js";

export async function register(req: AuthRequest, res: Response){
    try{
        const {userId} = req.body;
        const token = generateToken(userId);
        if(!token){
            return res.json({"msg": "no auth token found."});
        }

    }catch(e){
        console.log(e);
    } 
}

export async function login(req: Request, res: Response){
    try{

    }catch(e){
        console.log(e);
    } 
}