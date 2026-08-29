import axios from "axios";
import type { Response } from "express";
import { AuthRequest } from "../types/index.js";

const userServiceUrl = process.env.USER_SERVICE_URL;

if (!userServiceUrl) {
    throw new Error("USER_SERVICE_URL is not defined");
};

//todo: inject user data into headers, 2.Pass gateway verified identities downstream safely

export async function getUserService(req: AuthRequest, res: Response){
    try{
        console.log("hit")
        const response = await axios.get(userServiceUrl!, {
        headers: {
            // 'Authorization': 'Bearer token',
            'Accept': 'application/json',
            //2.
            "X-User-Id": req.user?.id || "",
            "X-User-Email": req.user?.email || "",
            "X-User-Name": req.user?.name || ""
        }
        });
        console.log(response.data);
        const data = response.data;
        return res.status(200).json(data);
    }catch(e){
        return res.status(500).json({ error: "Downstream service errorm." });

    } 
}

//get back jwt from user service. verify it gateway? so we need jwt at both places. when registraing 
//we store it back in the gateway, and use it to verify identity in the subsquent req.
export async function userRegister(req: AuthRequest, res: Response){
    try{
        console.log("user register")
        const response = await axios.post(userServiceUrl! + "/register", {
        headers: {
            // 'Authorization': 'Bearer token',
            'Accept': 'application/json',
            //2.
            "X-User-Id": req.user?.id || "",
            "X-User-Email": req.user?.email || "",
            "X-User-Name": req.user?.name || ""
        }
        });
        console.log(response.data);
        const data = response.data;
        return res.status(200).json(data);
    }catch(e){
        return res.status(500).json({ error: "Downstream service errorm." });
    } 
}


export async function userLogin(req: AuthRequest, res: Response){
    try{
        console.log("hit")
        const response = await axios.post(userServiceUrl! + "/login", {
        headers: {
            // 'Authorization': 'Bearer token',
            'Accept': 'application/json',
            //2.
            "X-User-Id": req.user?.id || "",
            "X-User-Email": req.user?.email || "",
            "X-User-Name": req.user?.name || ""
        }
        });
        console.log(response.data);
        const data = response.data;
        return res.status(200).json(data);
    }catch(e){
        return res.status(500).json({ error: "Downstream service errorm." });

    } 
}