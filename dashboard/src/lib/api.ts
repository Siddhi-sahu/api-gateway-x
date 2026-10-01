import type { CircuitBreakers, Health, Metrics, RequestRecord } from "../types";

export const API_URL = "http://localhost:3000";

async function fetchJson<T>(path: string, errorMessage: string): Promise<T> {
    const response = await fetch(`${API_URL}${path}`);

    if (!response.ok) {
        throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
}

export function getMetrics() {
    return fetchJson<Metrics>("/metrics", "Failed to fetch metrics");
}

export function getHealth() {
    return fetchJson<Health>("/health", "Failed to fetch health");
}

/**
 * Same call as getHealth, but also measures how long the browser waited.
 * /health fans out to Redis + both services before answering, so this
 * round-trip covers the whole probe — it is not per-service latency.
 */
export async function getHealthTimed() {
    const startedAt = performance.now();
    const data = await getHealth();
    return { data, rttMs: performance.now() - startedAt };
}

export function getRecentRequests() {
    return fetchJson<RequestRecord[]>("/recent-requests", "Failed to fetch recent requests");
}

export function getCircuitBreakers() {
    return fetchJson<CircuitBreakers>("/circuit-breakers", "Failed to fetch circuit breakers");
}
