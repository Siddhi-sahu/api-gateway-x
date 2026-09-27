export interface Metrics {
    requestsTotal: number,
    requestsFailed: number,
    cacheHits: number,
    cacheMisses: number,
    retries: number,
    rateLimitRejected: number,
    totalLatencyMs: number
};

export interface Health {
    gateway: "healthy" | "unhealthy";
    redis: "healthy" | "unhealthy";
    services: {
        userService: "healthy" | "unhealthy";
        productService: "healthy" | "unhealthy";
    };
};

export interface RequestRecord {
    requestId: string;
    method: string;
    route: string;
    statusCode: number;
    durationMs: number;
    timestamp: string;
}