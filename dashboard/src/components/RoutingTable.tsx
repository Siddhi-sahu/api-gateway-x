import type { CircuitBreakers, CircuitState, Health, Tick } from "../types";
import { sumTicks } from "../lib/derive";
import { cacheConfig, middlewareChain, rateLimitConfig, retryConfig, routes } from "../lib/gatewayConfig";
import { Panel, Tag } from "./ui";

interface RoutingTableProps {
    health: Health | null;
    circuitBreakers: CircuitBreakers | null;
    ticks: Tick[];
    metricsUnavailable: boolean;
}

interface Stage {
    name: string;
    role: string;
    reading: string;
    tone: string;
}

function shortCircuit(state: CircuitState | undefined) {
    return state ?? "—";
}

function worstTone(states: (CircuitState | undefined)[]) {
    if (states.includes("OPEN")) return "bad";
    if (states.includes("HALF_OPEN")) return "warn";
    return states.every(Boolean) ? "ok" : "idle";
}

/**
 * The path a proxied request takes through the gateway, stage by stage.
 * Stage order and roles are STATIC (from gateway source); the reading on
 * each stage is CLIENT-DERIVED from the counters collected this session.
 */
function RoutingTable({ health, circuitBreakers, ticks, metricsUnavailable }: RoutingTableProps) {
    const recent = sumTicks(ticks);
    const hasWindow = ticks.length > 0 && !metricsUnavailable;
    const count = (value: number, label: string) => (hasWindow ? `${value} ${label}` : "no window yet");
    const minutes = (recent.intervalMs / 60000).toFixed(1);

    const stages: Stage[] = [
        { name: "requestId", role: "Reads or mints X-Request-Id", reading: "on every response", tone: "plain" },
        { name: "requestLogger", role: "Counts, times, records", reading: count(recent.requests, "logged"), tone: "plain" },
        {
            name: "ratelimiter",
            role: `${rateLimitConfig.limit}/${rateLimitConfig.windowSeconds}s per IP`,
            reading: count(recent.rateLimited, "× 429"),
            tone: recent.rateLimited > 0 ? "warn" : "plain",
        },
        {
            name: "cache",
            role: `${cacheConfig.route} only`,
            reading: hasWindow ? `${recent.cacheHits} hit / ${recent.cacheMisses} miss` : "no window yet",
            tone: "plain",
        },
        {
            name: "breaker",
            role: "Fails fast when OPEN",
            reading: `U:${shortCircuit(circuitBreakers?.userService)} P:${shortCircuit(circuitBreakers?.productService)}`,
            tone: worstTone([circuitBreakers?.userService, circuitBreakers?.productService]),
        },
        {
            name: "retry",
            role: `${retryConfig.maxAttempts} tries, ${retryConfig.timeoutMs / 1000}s timeout each`,
            reading: count(recent.attempts, "attempts"),
            tone: "plain",
        },
        {
            name: "services",
            role: "user :3001 · product :3002",
            reading: health
                ? `U:${health.services.userService === "healthy" ? "UP" : "DOWN"} P:${health.services.productService === "healthy" ? "UP" : "DOWN"}`
                : "—",
            tone: health
                ? (health.services.userService === "healthy" && health.services.productService === "healthy" ? "ok" : "bad")
                : "idle",
        },
    ];

    return (
        <Panel
            id="request-path"
            title="REQUEST PATH"
            subtitle={<>What a proxied request passes through. Global middleware order: {middlewareChain.join(" → ")}.</>}
            meta={
                <>
                    <Tag kind="static" source="gateway/src/server.ts, routes/" />
                    <span className="meta-figure">
                        readings over {hasWindow ? `${minutes} min` : "—"} <Tag kind="derived" />
                    </span>
                </>
            }
        >
            <ol className="pipeline">
                {stages.map((stage) => (
                    <li className="pipeline__stage" key={stage.name}>
                        <span className="pipeline__name">{stage.name}</span>
                        <span className="pipeline__role">{stage.role}</span>
                        <span className={`pipeline__reading tone-${stage.tone}`}>{stage.reading}</span>
                    </li>
                ))}
            </ol>

            <div className="table-scroll">
                <table className="routes">
                    <thead>
                        <tr>
                            <th scope="col">METHOD</th>
                            <th scope="col">PATH</th>
                            <th scope="col">UPSTREAM</th>
                            <th scope="col">GUARDS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {routes.map((route) => (
                            <tr key={`${route.method} ${route.path}`}>
                                <td className={`method method--${route.method.toLowerCase()}`}>{route.method}</td>
                                <td className="code">{route.path}</td>
                                <td className="muted">{route.upstream}</td>
                                <td>
                                    {route.guards.length === 0
                                        ? <span className="dim">plain forward</span>
                                        : route.guards.map((guard) => <span className="chip" key={guard}>{guard}</span>)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="footnote">
                Every route also passes the global rate limiter. Calls to services carry X-Service-Key, and
                GET calls also carry X-Auth-User-Id. POST /api/products does not clear the product cache.
            </p>
        </Panel>
    );
}

export default RoutingTable;
