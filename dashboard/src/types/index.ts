// ---------------------------------------------------------------------------
// Shapes returned by the gateway (gateway/src/server.ts). These mirror the
// backend exactly — do not add fields here that the gateway does not send.
// ---------------------------------------------------------------------------

export type ServiceStatus = "healthy" | "unhealthy";
export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

/** GET /metrics — cumulative in-memory counters since gateway process start. */
export interface Metrics {
    requestsTotal: number,
    requestsFailed: number,
    cacheHits: number,
    cacheMisses: number,
    retries: number,
    rateLimitRejected: number,
    totalLatencyMs: number
};

/** GET /health — always HTTP 200; per-dependency status inside the body. */
export interface Health {
    gateway: ServiceStatus;
    redis: ServiceStatus;
    services: {
        userService: ServiceStatus;
        productService: ServiceStatus;
    };
};

/** One entry of GET /recent-requests (last 10, newest first). */
export interface RequestRecord {
    requestId: string;
    method: string;
    route: string;
    statusCode: number;
    durationMs: number;
    timestamp: string;
}

/** GET /circuit-breakers */
export interface CircuitBreakers {
    productService: CircuitState;
    userService: CircuitState;
}

// ---------------------------------------------------------------------------
// Client-side shapes. Everything below is produced by the dashboard itself
// from the responses above — never by the gateway.
// ---------------------------------------------------------------------------

export type EndpointKey = "metrics" | "health" | "requests" | "circuits";
export type EndpointErrors = Partial<Record<EndpointKey, boolean>>;

/** A /metrics response stamped with the browser time it arrived. */
export interface MetricsSample {
    at: number;
    metrics: Metrics;
}

/** One /health poll. `health` is null when the probe itself failed. */
export interface HealthSample {
    at: number;
    health: Health | null;
    rttMs: number | null;
}

/** Counter growth between two consecutive /metrics samples. */
export interface Tick {
    at: number;
    intervalMs: number;
    requests: number;
    failed: number;
    rateLimited: number;
    attempts: number;
    cacheHits: number;
    cacheMisses: number;
    latencyMs: number;
}

/** A circuit state change noticed by comparing two /circuit-breakers polls. */
export interface CircuitTransition {
    service: keyof CircuitBreakers;
    from: CircuitState;
    to: CircuitState;
    observedAt: number;
}
