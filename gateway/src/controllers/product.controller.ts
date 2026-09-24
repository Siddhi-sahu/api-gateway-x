import axios from "axios";
import type { Request, Response } from "express";
import { AuthRequest } from "../types/auth.js";
import { retry } from "../utils/retry.js";
import { productServiceCircuitBreaker } from "../utils/circuitBreaker.js";
import redisClient from "../config/redis.js";
import { logger } from "../utils/logger.js";

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
        let cached: string | null = null;
        try{
            cached = await redisClient.get(redisCacheKey);
        }catch(e){
            console.error("cache reading from redis failed", e);
            logger.error("cache_read_failed", {
                requestId: req.requestId,
                error: e instanceof Error
                    ? e.message
                    : "Unknown error"
            });
        }
        if(cached){
            console.log("cache hit")
            logger.info("cache_hit_get_products", {
                requestId: req.requestId,
                key: redisCacheKey
            });
            return res.status(200).json({
                source: "cache",
                data: JSON.parse(cached)
            })
        };

        console.log("cachee missed");
        logger.info("cache_miss_get_products", {
            requestId: req.requestId,
            key: redisCacheKey
        });

        const response = await productServiceCircuitBreaker.execute(()=>retry(()=>axios.get(productServiceUrl!,{   
            timeout: 3000,
            headers: {
                // 'Authorization': 'Bearer token',
                'Accept': 'application/json',
                "X-Auth-User-Id": req.user?.id || "",
                "X-Service-Key": SERVICE_API_KEY,
                "X-Request-Id": req.requestId,
            }
        }))); 
        try{
            await redisClient.set(redisCacheKey, JSON.stringify(response.data), { EX: 60 });
        }catch(e){
            console.error("redis cache write failed", e);
        }

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
                "X-Request-Id": req.requestId,
            }
        });
        console.log(response.data);
        return res.status(200).json(response.data);
    }catch(e){
        console.log(e);
        return res.status(500).json({ error: e, msg: "Downstream Product service error. " });
    } 
}