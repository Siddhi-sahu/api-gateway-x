// ---------------------------------------------------------------------------
// STATIC values copied from the gateway source code.
//
// No endpoint exposes these, so they are hardcoded here and every one is
// shown in the UI with a [STATIC] tag plus the file it came from.
// If the gateway code changes, update this file.
// ---------------------------------------------------------------------------

export const POLL_INTERVAL_MS = 5000;

/** Requests the dashboard itself sends per poll (all four count in requestsTotal). */
export const DASHBOARD_REQUESTS_PER_POLL = 4;

export const circuitBreakerConfig = {
    failureThreshold: 3,
    resetTimeoutMs: 10_000,
    source: "gateway/src/utils/circuitBreaker.ts:81-82",
};

export const rateLimitConfig = {
    limit: 500,
    windowSeconds: 60,
    algorithm: "Fixed window · Redis INCR + EXPIRE",
    scope: "per client IP",
    failMode: "fails open if Redis errors",
    source: "gateway/src/middlewares/ratelimiter.ts:9-10",
};

export const cacheConfig = {
    route: "GET /api/products",
    key: "cache:products:all",
    ttlSeconds: 60,
    source: "gateway/src/controllers/product.controller.ts:65",
};

export const retryConfig = {
    maxAttempts: 3,
    backoffMs: [100, 200],
    timeoutMs: 3000,
    retryOn: ["ECONNABORTED", "ETIMEDOUT", "ECONNREFUSED", "ERR_NETWORK", "502", "503", "504"],
    source: "gateway/src/utils/retry.ts",
};

/** Global middleware order from gateway/src/server.ts:19-24. */
export const middlewareChain = ["cors", "json", "requestId", "requestLogger", "ratelimiter"];

export interface GatewayRoute {
    method: string;
    path: string;
    upstream: string;
    guards: string[];
}

export const routes: GatewayRoute[] = [
    { method: "GET", path: "/api/products", upstream: "product-service :3002", guards: ["cache", "breaker", "retry"] },
    { method: "POST", path: "/api/products", upstream: "product-service :3002", guards: [] },
    { method: "GET", path: "/api/users", upstream: "user-service :3001", guards: ["jwt", "breaker", "retry"] },
    { method: "POST", path: "/api/auth/register", upstream: "user-service :3001", guards: [] },
    { method: "POST", path: "/api/auth/login", upstream: "user-service :3001", guards: [] },
];
