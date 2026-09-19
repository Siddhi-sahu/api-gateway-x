import axios from "axios";
import type { Request, Response } from "express";
import { AuthRequest } from "../types/index.js";
import { retry } from "../utils/retry.js";
import { productServiceCircuitBreaker } from "../utils/circuitBreaker.js";
import redisClient from "../config/redis.js";

const productServiceUrl = process.env.PRODUCT_SERVICE_URL;
const SERVICE_API_KEY= process.env.SERVICE_API_KEY;

if (!productServiceUrl) {
    throw new Error("PRODUCT_SERVICE_URL is not defined");
};

if(!SERVICE_API_KEY){
    throw new Error("SERVICE_API_KEY is not defined");        
}

export async function getProductService(req: AuthRequest, res: Response){
    const redisCacheKey = `cache:products:all`;
    try{
        //cache hit logic
        const cached = await redisClient.get(redisCacheKey);

        if(cached){
            console.log("cache hit")
            return res.status(200).json({
                source: "cache",
                data: JSON.parse(cached)
            })
        };

        console.log("cachee missed");

        const response = await productServiceCircuitBreaker.execute(()=>retry(()=>axios.get(productServiceUrl!,{   
            timeout: 3000,
            headers: {
                // 'Authorization': 'Bearer token',
                'Accept': 'application/json',
                "X-Auth-User-Id": req.user?.id || "",
                "X-Service-Key": SERVICE_API_KEY,
            }
        }))); 
        await redisClient.set(redisCacheKey, JSON.stringify(response.data), { EX: 60 });

        return res.status(200).json(response.data);
    }catch(e){
        // console.log(e);
        return res.status(500).json({ msg: "Downstream product service error." });
    } 
}


export async function addProductService(req: Request, res: Response){
    const {name, price} = req.body;
    try{
        console.log("hit product")
        const response = await axios.post(productServiceUrl!,{
            name, 
            price
        },{
            timeout: 3000,
            headers: {
                "X-Service-Key": SERVICE_API_KEY,
            }
        });
        console.log(response.data);
        return res.status(200).json(response.data);
    }catch(e){
        console.log(e);
        return res.status(500).json({ error: e, msg: "Downstream Product service error. " });
    } 
}