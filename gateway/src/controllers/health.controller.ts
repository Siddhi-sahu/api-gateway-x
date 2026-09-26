import axios from "axios";
import type { Request, Response } from "express";

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


export async function health(req: Request, res: Response){
    // const redisHealthy = await check redis
    try{
        const userServiceHealth = await axios.get(userServiceUrl! + "/health", {   
            timeout: 3000,
            headers: {
                'Accept': 'application/json',
                "X-Service-Key": SERVICE_API_KEY,
                "X-Request-Id": req.requestId
            }
        });
    const productServiceHealth = await axios.get(productServiceUrl! + "/health", {
        timeout: 3000,
        headers: {
            "X-Service-Key": SERVICE_API_KEY,
        }
    });

    return res.json({
        gateway: "healthy",
        // redis: redisHealthy ? "healthy" : "unhealthy"
        userService: userServiceHealth.data.status,
        productService: productServiceHealth.data.status
    });

    }catch(e){
        console.log(e);
        return;
    }
    
}