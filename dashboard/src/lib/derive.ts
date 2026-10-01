// ---------------------------------------------------------------------------
// CLIENT-DERIVED values.
//
// Pure functions that turn the real gateway responses into rates, ratios and
// history. Nothing here invents data: with no samples, functions return null
// or empty arrays and the UI shows that plainly.
// ---------------------------------------------------------------------------
import type {
    CircuitBreakers,
    CircuitTransition,
    Health,
    HealthSample,
    Metrics,
    MetricsSample,
    ServiceStatus,
    Tick,
} from "../types";

/** How many polls of history the dashboard keeps in memory (60 × 5s = 5 min). */
export const HISTORY_LIMIT = 60;

function ratio(part: number, whole: number) {
    return whole === 0 ? 0 : part / whole;
}

// --- Cumulative ratios (same maths the original MetricsPanel used) ---------

export function successRate(metrics: Metrics) {
    const successful = Math.max(metrics.requestsTotal - metrics.requestsFailed, 0);
    return ratio(successful, metrics.requestsTotal) * 100;
}

export function failureRate(metrics: Metrics) {
    return ratio(metrics.requestsFailed, metrics.requestsTotal) * 100;
}

export function averageLatency(metrics: Metrics) {
    return ratio(metrics.totalLatencyMs, metrics.requestsTotal);
}

export function cacheLookups(metrics: Metrics) {
    return metrics.cacheHits + metrics.cacheMisses;
}

export function cacheHitRate(metrics: Metrics) {
    return ratio(metrics.cacheHits, cacheLookups(metrics)) * 100;
}

// --- Deltas between polls ---------------------------------------------------

/**
 * Gateway counters only ever go up. If any of them went down between two
 * samples, the gateway process restarted and its counters were reset.
 */
export function isCounterReset(previous: Metrics, next: Metrics) {
    return (Object.keys(next) as (keyof Metrics)[]).some((key) => next[key] < previous[key]);
}

export function diffSamples(previous: MetricsSample, next: MetricsSample): Tick {
    const a = previous.metrics;
    const b = next.metrics;
    return {
        at: next.at,
        intervalMs: next.at - previous.at,
        requests: b.requestsTotal - a.requestsTotal,
        failed: b.requestsFailed - a.requestsFailed,
        rateLimited: b.rateLimitRejected - a.rateLimitRejected,
        attempts: b.retries - a.retries,
        cacheHits: b.cacheHits - a.cacheHits,
        cacheMisses: b.cacheMisses - a.cacheMisses,
        latencyMs: b.totalLatencyMs - a.totalLatencyMs,
    };
}

/** Turns N samples into N-1 ticks (one per pair of consecutive samples). */
export function toTicks(samples: MetricsSample[]): Tick[] {
    const ticks: Tick[] = [];
    for (let i = 1; i < samples.length; i++) {
        ticks.push(diffSamples(samples[i - 1], samples[i]));
    }
    return ticks;
}

export function perSecond(count: number, intervalMs: number) {
    return intervalMs <= 0 ? 0 : count / (intervalMs / 1000);
}

/** Totals across a list of ticks — used for the "last N polls" window. */
export function sumTicks(ticks: Tick[]) {
    return ticks.reduce(
        (total, tick) => ({
            intervalMs: total.intervalMs + tick.intervalMs,
            requests: total.requests + tick.requests,
            failed: total.failed + tick.failed,
            rateLimited: total.rateLimited + tick.rateLimited,
            attempts: total.attempts + tick.attempts,
            cacheHits: total.cacheHits + tick.cacheHits,
            cacheMisses: total.cacheMisses + tick.cacheMisses,
            latencyMs: total.latencyMs + tick.latencyMs,
        }),
        { intervalMs: 0, requests: 0, failed: 0, rateLimited: 0, attempts: 0, cacheHits: 0, cacheMisses: 0, latencyMs: 0 },
    );
}

// --- Health history ---------------------------------------------------------

export type HealthComponent = "gateway" | "redis" | "userService" | "productService";

function statusOf(health: Health, component: HealthComponent): ServiceStatus {
    if (component === "gateway" || component === "redis") return health[component];
    return health.services[component];
}

/**
 * Share of this session's polls where a component reported "healthy".
 *
 * - Gateway: a failed /health request counts as DOWN (the gateway did not answer).
 * - Others: a failed /health request is skipped — we simply don't know their state.
 */
export function observedUptime(samples: HealthSample[], component: HealthComponent) {
    let healthy = 0;
    let counted = 0;

    for (const sample of samples) {
        if (!sample.health) {
            if (component === "gateway") counted++;
            continue;
        }
        counted++;
        if (statusOf(sample.health, component) === "healthy") healthy++;
    }

    return { percent: counted === 0 ? null : (healthy / counted) * 100, samples: counted };
}

// --- Circuit breakers -------------------------------------------------------

export function diffCircuits(previous: CircuitBreakers, next: CircuitBreakers, observedAt: number): CircuitTransition[] {
    return (Object.keys(next) as (keyof CircuitBreakers)[])
        .filter((service) => previous[service] !== next[service])
        .map((service) => ({ service, from: previous[service], to: next[service], observedAt }));
}

// --- Formatting helpers -----------------------------------------------------

/** "[||||||||····]" — a text gauge, `width` characters wide. */
export function asciiBar(percent: number, width = 16) {
    const filled = Math.round((Math.min(Math.max(percent, 0), 100) / 100) * width);
    return `[${"|".repeat(filled)}${"·".repeat(width - filled)}]`;
}

export function formatClock(value: Date | number | string | null, withMillis = false) {
    if (value === null) return withMillis ? "--:--:--.---" : "--:--:--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    const pad = (n: number, size = 2) => String(n).padStart(size, "0");
    const clock = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    return withMillis ? `${clock}.${pad(date.getMilliseconds(), 3)}` : clock;
}

export function formatNumber(value: number) {
    return value.toLocaleString("en-US");
}
