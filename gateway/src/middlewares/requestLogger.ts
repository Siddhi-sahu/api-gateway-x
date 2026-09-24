import { NextFunction, Response, Request } from "express";
import { logger } from "../utils/logger.js";
import { metrics } from "../utils/metrics.js";


export function requestLogger(req: Request, res: Response, next: NextFunction){
    const start = Date.now();
    res.on("finish", () => {
        metrics.requestsTotal++;
        if (res.statusCode >= 500) {
            metrics.requestsFailed++;
        }
        const duration = Date.now() - start;
        logger.info("request_completed", {
            requestId: req.requestId,
            method: req.method,
            route: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: duration
        })
    });

    next();
};