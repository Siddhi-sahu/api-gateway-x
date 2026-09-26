export interface Metrics {
    requestsTotal: number,
    requestsFailed: number,
    cacheHits: number,
    cacheMisses: number,
    retries: number,
    rateLimitRejected: number
};

export interface Health {
    gateway: "healthy" | "unhealthy";
    redis: "healthy" | "unhealthy";
    services: {
        user: "healthy" | "unhealthy";
        product: "healthy" | "unhealthy";
    };
}