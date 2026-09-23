import { NextFunction, Response, Request } from "express";


export function requestLogger(req: Request, res: Response, next: NextFunction){
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        logger
    })
}