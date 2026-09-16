import axios from "axios";
import type { Request, Response } from "express";
import { AuthRequest } from "../types/index.js";
import { retry } from "../utils/retry.js";
import { productServiceCircuitBreaker } from "../utils/circuitBreaker.js";

const productServiceUrl = process.env.PRODUCT_SERVICE_URL;
const SERVICE_API_KEY= process.env.SERVICE_API_KEY;

if (!productServiceUrl) {
    throw new Error("PRODUCT_SERVICE_URL is not defined");
};

if(!SERVICE_API_KEY){
    throw new Error("SERVICE_API_KEY is not defined");        
}

export async function getProductService(req: AuthRequest, res: Response){
    try{
        console.log("hit product....")
        const response = await productServiceCircuitBreaker.execute(()=>retry(()=>axios.get(productServiceUrl!,{   
            timeout: 3000,
            headers: {
                // 'Authorization': 'Bearer token',
                'Accept': 'application/json',
                "X-Auth-User-Id": req.user?.id || "",
                "X-Service-Key": SERVICE_API_KEY,
            }
        }))); 
        console.log(response.data);
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
        });
        console.log(response.data);
        return res.status(200).json(response.data);
    }catch(e){
        console.log(e);
        return res.status(500).json({ error: e, msg: "Downstream user service error." });
    } 
}