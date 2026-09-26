import axios from "axios";
import type { Request, Response } from "express";
import redisClient from "../config/redis.js";

const userServiceUrl = process.env.USER_SERVICE_URL;
const SERVICE_API_KEY= process.env.SERVICE_API_KEY;
const productServiceUrl = process.env.PRODUCT_SERVICE_URL;


if (!userServiceUrl) {
    throw new Error("USER_SERVICE_URL is not defined");
};
if(!SERVICE_API_KEY){
    throw new Error("SERVICE_API_KEY is not defined");        
}

if (!productServiceUrl) {
    throw new Error("PRODUCT_SERVICE_URL is not defined");
};

type Health = "healthy" | "unhealthy";

export async function health(req: Request, res: Response){
    let redisHealth;
    let userServiceHealth;
    let productServiceHealth;
    
    try{
        const res = await redisClient.ping();
        console.log(res);
        redisHealth = res === "PONG" ? "healthy" : "unhealthy";
    }catch {
        redisHealth = "unhealthy";
    };
    try{
        const userServiceHealthRes = await axios.get(userServiceUrl! + "/health", {   
            timeout: 3000,
            headers: {
                'Accept': 'application/json',
                "X-Service-Key": SERVICE_API_KEY,
                "X-Request-Id": req.requestId
            }
        });
        userServiceHealth = userServiceHealthRes.data.status;
    }catch(e){
        console.log(e);
        userServiceHealth = "unhealthy";

    };

    try{
        const productServiceHealthRes = await axios.get(productServiceUrl! + "/health", {
            timeout: 3000,
            headers: {
                "X-Service-Key": SERVICE_API_KEY,
            }
        });
        productServiceHealth = productServiceHealthRes.data.status;

    }catch(e){
        console.log(e);
        productServiceHealth = "unhealthy";
    }
    
    return res.json({
        gateway: "healthy",
        redis: redisHealth,
        userService: userServiceHealth,
        productService: productServiceHealth
    });

    
    
}