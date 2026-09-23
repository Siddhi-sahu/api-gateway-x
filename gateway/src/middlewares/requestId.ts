import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

export function requestId(req: Request, res: Response, next: NextFunction){
        const id = typeof req.headers["x-request-id"] === "string"
            ? req.headers["x-request-id"] : randomUUID();


        req.requestId = id;
        res.setHeader("X-Request-Id", id);

        next();
}