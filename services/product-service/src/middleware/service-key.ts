import type { Response, NextFunction } from "express";
import { AuthRequest } from "../types/index.js";

const ServiceKey = process.env.SERVICE_API_KEY;
if(!ServiceKey){
    throw new Error("SERVICE_API_KEY is not defined");  
}

export const serviceKeyMiddleware = async(req: AuthRequest, res: Response, next: NextFunction) =>{
    try{
        const serviceKey = req.headers["x-service-key"];
    // console.log("Service key type: ", typeof serviceKey);
    // console.log(serviceKey);
    if(!serviceKey || serviceKey !== ServiceKey){
        return res.status(401).json({
        message: "Invalid service credentials or missing headersss."
    });
    }
    //attach service key to req?

    // req.serviceKey = serviceKey;
    next();

    }catch(e){
        console.log(e);
        return res.status(500).json({msg : "service key validation failure."})

    }
    

} 