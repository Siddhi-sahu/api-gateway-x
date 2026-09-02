import axios from "axios";
import type { Request, Response } from "express";

const productServiceUrl = process.env.PRODUCT_SERVICE_URL;

if (!productServiceUrl) {
    throw new Error("PRODUCT_SERVICE_URL is not defined");
};

export async function getProductService(req: Request, res: Response){
    try{
        console.log("hit product....")
        const response = await axios.get(productServiceUrl!);
        console.log(response.data);
        return res.status(200).json(response.data);
    }catch(e){
        console.log(e);
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
    } 
}