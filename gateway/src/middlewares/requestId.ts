import { Request, NextFunction } from "express";

interface NRequest extends Request {
    requestId: string;
}

export function requestId(req: NRequest, next: NextFunction){
        const randomId = "randomIdLogic";
        const id = typeof req.headers["x-request-id"] === "string"
            ? req.headers["x-request-id"] : randomId;


        req.requestId = id;

        next();
}