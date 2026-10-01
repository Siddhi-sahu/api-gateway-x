import type { CircuitBreakers, CircuitState, CircuitTransition, Health, Metrics, Tick } from "../types";
import { formatClock, formatNumber } from "../lib/derive";
import { circuitBreakerConfig, rateLimitConfig, retryConfig } from "../lib/gatewayConfig";
import { Panel, Readout, Tag } from "./ui";

interface OperationsPanelProps {
    health: Health | null;
    metrics: Metrics | null;
    circuitBreakers: CircuitBreakers | null;
    healthUnavailable: boolean;
    metricsUnavailable: boolean;
    circuitsUnavailable: boolean;
    ticks: Tick[];
    transitions: CircuitTransition[];
}

const BREAKERS: { key: keyof CircuitBreakers; name: string; guards: string }[] = [
    { key: "userService", name: "USER_SERVICE", guards: "GET /api/users" },
    { key: "productService", name: "PRODUCT_SERVICE", guards: "GET /api/products" },
];

function circuitTone(state: CircuitState | undefined) {
    if (state === "OPEN") return "bad";
    if (state === "HALF_OPEN") return "warn";
    if (state === "CLOSED") return "ok";
    return "idle";
}

/** "+3" for the last poll, or nothing when there's no delta yet. */
function LastTickDelta({ value }: { value: number | undefined }) {
    if (value === undefined) return null;
    return <span className={value > 0 ? "delta delta--up" : "delta"}>+{value} last poll</span>;
}

function counter(value: number | undefined, unavailable: boolean) {
    if (unavailable) return "UNAVAILABLE";
    return value === undefined ? "—" : formatNumber(value);
}

function OperationsPanel({
    health,
    metrics,
    circuitBreakers,
    healthUnavailable,
    metricsUnavailable,
    circuitsUnavailable,
    ticks,
    transitions,
}: OperationsPanelProps) {
    const lastTick = ticks.at(-1);
    const redisState = healthUnavailable ? "UNKNOWN" : health ? health.redis.toUpperCase() : "PENDING";
    const redisTone = health?.redis === "unhealthy" && !healthUnavailable ? "bad" : health && !healthUnavailable ? "ok" : "idle";
    const openCount = circuitBreakers
        ? BREAKERS.filter(({ key }) => circuitBreakers[key] === "OPEN").length
        : null;

    return (
        <Panel
            id="gateway-operations"
            title="GATEWAY OPERATIONS"
            subtitle="Protection mechanisms and their live state."
            className="operations"
            meta={<Tag kind="live" source="/metrics /health /circuit-breakers" />}
        >
            <div className="cluster">
                <h3 className="cluster__title">CONTROL PATH</h3>
                <Readout
                    label="REDIS"
                    note="Holds rate-limit counters and the product cache"
                    value={<span className={`badge tone-${redisTone}`}>{redisState}</span>}
                />
                <Readout
                    label="RATE-LIMIT REJECTIONS · 429"
                    note={<>
                        {rateLimitConfig.limit} req / {rateLimitConfig.windowSeconds}s {rateLimitConfig.scope}, {rateLimitConfig.failMode}{" "}
                        <Tag kind="static" />
                    </>}
                    value={<>{counter(metrics?.rateLimitRejected, metricsUnavailable)}<LastTickDelta value={lastTick?.rateLimited} /></>}
                    tone={metrics && metrics.rateLimitRejected > 0 ? "warn" : "plain"}
                />
                <Readout
                    label="DOWNSTREAM ATTEMPTS"
                    note={<>
                        Counts every try, the first included. Up to {retryConfig.maxAttempts} per request, backoff{" "}
                        {retryConfig.backoffMs.join(" → ")} ms <Tag kind="static" />
                    </>}
                    value={<>{counter(metrics?.retries, metricsUnavailable)}<LastTickDelta value={lastTick?.attempts} /></>}
                />
            </div>

            <div className="cluster">
                <h3 className="cluster__title">
                    CIRCUIT BREAKERS
                    <span className="cluster__aside">
                        {circuitBreakerConfig.failureThreshold} failures open · {circuitBreakerConfig.resetTimeoutMs / 1000}s to half-open{" "}
                        <Tag kind="static" />
                    </span>
                </h3>
                {BREAKERS.map(({ key, name, guards }) => {
                    const state = circuitBreakers?.[key];
                    const label = circuitsUnavailable ? "UNAVAILABLE" : state ?? "PENDING";
                    return (
                        <div className="breaker" key={key}>
                            <div>
                                <strong>{name}</strong>
                                <small>guards {guards}</small>
                            </div>
                            <span className={`bracket tone-${circuitsUnavailable ? "idle" : circuitTone(state)}`}>
                                [ {label} ]
                            </span>
                        </div>
                    );
                })}
                <p className="footnote">
                    OPEN fails fast with no downstream call. After {circuitBreakerConfig.resetTimeoutMs / 1000}s the
                    next request is let through as a HALF_OPEN trial. With no traffic, the state stays OPEN.
                </p>
            </div>

            <div className="cluster">
                <h3 className="cluster__title">
                    STATE CHANGES
                    <span className="cluster__aside">observed between polls <Tag kind="derived" /></span>
                </h3>
                {transitions.length === 0 ? (
                    <p className="dim small">No breaker state changes seen since this page opened.</p>
                ) : (
                    <ol className="transitions">
                        {transitions.map((change) => (
                            <li key={`${change.service}-${change.observedAt}`}>
                                <time>{formatClock(change.observedAt)}</time>
                                <span>{change.service === "userService" ? "USER_SERVICE" : "PRODUCT_SERVICE"}</span>
                                <span className={`tone-${circuitTone(change.from)}`}>{change.from}</span>
                                <span className="dim">→</span>
                                <span className={`tone-${circuitTone(change.to)}`}>{change.to}</span>
                            </li>
                        ))}
                    </ol>
                )}
            </div>

            <div className="summary-line">
                <span>BREAKERS OPEN</span>
                <strong className={openCount ? "tone-bad" : "tone-ok"}>
                    {openCount === null ? "—" : `${openCount} / ${BREAKERS.length}`}
                </strong>
            </div>
        </Panel>
    );
}

export default OperationsPanel;
