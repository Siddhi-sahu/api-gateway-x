import axios from "axios";
import type { Request, Response } from "express";

const userServiceUrl = process.env.USER_SERVICE_URL;

if (!userServiceUrl) {
    throw new Error("USER_SERVICE_URL is not defined");
};

export async function getUserService(req: Request, res: Response){
    try{
        console.log("hit")
        const response = await axios.get(userServiceUrl!);
        console.log(response.data);
        return res.status(200).json(response.data);
    }catch(e){
        console.log(e);
    } 
}