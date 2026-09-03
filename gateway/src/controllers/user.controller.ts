import axios from "axios";
import type { Response } from "express";
import { AuthRequest } from "../types/index.js";

const userServiceUrl = process.env.USER_SERVICE_URL;
const SERVICE_API_KEY= process.env.SERVICE_API_KEY;


if (!userServiceUrl) {
    throw new Error("USER_SERVICE_URL is not defined");
};
if(!SERVICE_API_KEY){
    throw new Error("SERVICE_API_KEY is not defined");        
}

export async function getUserService(req: AuthRequest, res: Response){
    // const userId = req.user?.id;
    // if(!userId)
    console.log("userid:", req.user?.id);

    try{
        const response = await axios.get(userServiceUrl!, {
        headers: {
            // 'Authorization': 'Bearer token',
            'Accept': 'application/json',
            "X-Auth-User-Id": req.user?.id || "",
            "X-Service-Key": SERVICE_API_KEY,
        }
        });

        console.log(response.data);
        const data = response.data;
        return res.status(200).json(data);
    }catch(e){
        return res.status(500).json({ error: e, msg: "Downstream service errorm." });

    } 
}

//get back jwt from user service. verify it gateway? so we need jwt at both places. when registraing 
//we store it back in the gateway, and use it to verify identity in the subsquent req.
export async function userRegister(req: AuthRequest, res: Response){
    const {name, email, password} = req.body;
        if (!name || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
    };
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
            //2.
            // "X-User-Id": req.user?.id || "",
            // "X-User-Email": req.user?.email || "",
            // "X-User-Name": req.user?.name || ""
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
            //2.
            // "X-User-Id": req.user?.id || "",
            // "X-User-Email": req.user?.email || "",
            // "X-User-Name": req.user?.name || ""
        }
        });
        console.log(response.data);
        const jwt = response.data;
        return res.status(200).json(jwt);
    }catch(e){
        return res.status(500).json({ error: e, msg: "Downstream service errorm." });

    } 
}