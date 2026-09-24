import axios from "axios";
import type { Response } from "express";
import { AuthRequest } from "../types/auth.js";
import { retry } from "../utils/retry.js";
import { userServiceCircuitBreaker } from "../utils/circuitBreaker.js";
import { logger } from "../utils/logger.js";

const userServiceUrl = process.env.USER_SERVICE_URL;
const SERVICE_API_KEY= process.env.SERVICE_API_KEY;


if (!userServiceUrl) {
    throw new Error("USER_SERVICE_URL is not defined");
};
if(!SERVICE_API_KEY){
    throw new Error("SERVICE_API_KEY is not defined");        
}

export async function getUserService(req: AuthRequest, res: Response){
    logger.info("get_users_query_started", {
    requestId: req.requestId
    });
    const getUsersStart = Date.now();

    try{
        const response = await userServiceCircuitBreaker.execute(()=>retry(()=>axios.get(userServiceUrl!, {   
            timeout: 3000,
            headers: {
                // 'Authorization': 'Bearer token',
                'Accept': 'application/json',
                "X-Auth-User-Id": req.user?.id || "",
                "X-Service-Key": SERVICE_API_KEY,
                "X-Request-Id": req.requestId
            }
        }), 3, {requestId: req.requestId, service: "user-service"})); 

        const data = response.data;
        const getUsersDuration = Date.now() - getUsersStart;

        
        logger.info("get_users_query_completed", {
            requestId: req.requestId,
            usersCount: data.length,
            service: "user-service",
            durationMs: getUsersDuration,
            statusCode: response.status
        });
        return res.status(200).json(data);
    }catch(e){

        // Circuit is open; fourth req failure this is triggered
        if(e instanceof Error && e.message ==="CIRCUIT_OPEN"){
            return res.status(503).json({
                error: "User service temporarily unavailable"
            })
        }

        //extract errors from downsttream
        if(axios.isAxiosError(e)){
            console.log("Downstream user service status: ", e.response?.status);
            console.log("Downstream user service data: ", e.response?.data);

        if (
            e.code === "ECONNABORTED" ||
            e.code === "ETIMEDOUT"
        ) {
            return res.status(504).json({
                error: "User service timed out"
            });
        }

            //3 times request failure this is trigerred 
            return res.status(502).json({ error: "User service unavailable" });
        }
        //later when we have gateway logic; clear distinction of errors.
        console.log(e);
        return res.status(500).json({ error : " Gateway error"})

    } 
}

//get back jwt from user service. verify it gateway? so we need jwt at both places. when registraing 
//we store it back in the gateway, and use it to verify identity in the subsquent req.
export async function userRegister(req: AuthRequest, res: Response){
    const {name, email, password} = req.body;
        if (!name || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
    };
    console.log(name, email, password);

    try{
        console.log("user register")
        const response = await axios.post(userServiceUrl! + "/auth/register",{
            name,
            email,
            password
        } ,{
        headers: {
            // 'Authorization': 'Bearer token',
            'Accept': 'application/json',
            "X-Service-Key": SERVICE_API_KEY,
            // "X-User-Id": req.user?.id || "",
            // "X-User-Email": req.user?.email || "",
            
        }
        });
        console.log(response.data);
        const data = response.data;
        return res.status(200).json(data);
    }catch(e){
        return res.status(500).json({ error: e, msg: "Downstream service error." });

    } 
}


export async function userLogin(req: AuthRequest, res: Response){
    const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Missing fields" });
        };
    try{
        console.log("hit")
        const response = await axios.post(userServiceUrl! + "/auth/login", {
            email,
            password
        }, {
        headers: {
            // 'Authorization': 'Bearer token',
            'Accept': 'application/json',
            "X-Service-Key": SERVICE_API_KEY,
            // "X-User-Id": req.user?.id || "",
            // "X-User-Email": req.user?.email || "",
        }
        });
        console.log(response.data);
        const jwt = response.data;
        return res.status(200).json(jwt);
    }catch(e){
        return res.status(500).json({ error: e, msg: "Downstream service errorm." });

    } 
}