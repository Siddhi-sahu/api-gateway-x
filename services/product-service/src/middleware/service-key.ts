import type { Response, NextFunction } from "express";
import { AuthRequest } from "../types/index.js";

const ServiceKey = process.env.SERVICE_API_KEY;
if(!ServiceKey){
    throw new Error("SERVICE_API_KEY is not defined");  
}

export const serviceKeyMiddleware = async(req: AuthRequest, res: Response, next: NextFunction) =>{
    try{
        const serviceKey = req.headers["x-service-key"];
    if(!serviceKey || serviceKey !== ServiceKey){
        console.log("this hit");
        return res.status(401).json({
        message: "Invalid service credentials or missing headersss."
    });
    }
    next();

    }catch(e){
        console.log(e);
        return res.status(500).json({msg : "service key validation failure."})

    }
    

} 