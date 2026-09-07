import type { Response, NextFunction } from "express";
import redisClient from "../config/redis.js";
import { AuthRequest } from "../types/index.js";

//allow 10 re/min
//fixed window counter
const REQUEST_LIMIT = 10;
const WINDOW_SIZE_IN_SECONDS = 60;

export const ratelimiter = async(req: AuthRequest, res: Response, next: NextFunction) =>{
    const user = req.user?.id || req.ip;
    const redisKey = `rate-limit:${user}`;
    
    try{
        const currentRequests = await redisClient.incr(redisKey);

        if(currentRequests == 1){
            await redisClient.expire(redisKey, WINDOW_SIZE_IN_SECONDS);
        }

        const ttl = await redisClient.ttl(redisKey);

        //send headers back to client
        res.setHeader("rate-limit", REQUEST_LIMIT);
        res.setHeader("Requests-remaining", Math.max(0,REQUEST_LIMIT - currentRequests));
        res.setHeader("Rate-limit-reset", ttl);

        if(currentRequests>REQUEST_LIMIT){
            return res.status(429).json({
                error: "Too many requests",
                msg: `You have exceeded your req quota. Try again in ${ttl}sec`
            })
        };

        next();

    }catch(error){
        console.error("Rate limiting error:", error);
        // Fail-open strategy
        next();

    }
}