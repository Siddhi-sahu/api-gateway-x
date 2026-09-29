import { NextFunction, Response, Request } from "express";
import { logger } from "../utils/logger.js";
import { metrics } from "../utils/metrics.js";
import { addRequest } from "../utils/requestRecord.js";


export function requestLogger(req: Request, res: Response, next: NextFunction){
    const start = Date.now();
    res.on("finish", () => {
        metrics.requestsTotal++;
        if (res.statusCode >= 500) {
            metrics.requestsFailed++;
        }
        const duration = Date.now() - start;
        metrics.totalLatencyMs += duration;

        const record = {
            requestId: req.requestId,
            method: req.method,
            route: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: duration,
            timestamp: new Date().toISOString()
        };

        if (
            req.originalUrl !== "/health" &&
            req.originalUrl !== "/metrics" &&
            req.originalUrl !== "/recent-requests"
        ) {
            addRequest(record);
        }
        logger.info("request_completed", record);
    });

    next();
};