import type { Health, HealthSample, ServiceStatus } from "../types";
import { observedUptime, type HealthComponent } from "../lib/derive";
import { Panel, Tag } from "./ui";

interface SystemStatusProps {
    health: Health | null;
    unavailable: boolean;
    samples: HealthSample[];
    rttMs: number | null;
}

interface Dependency {
    component: HealthComponent;
    name: string;
    port: string;
    responsibility: string;
    probe: string;
}

// What each dependency does and how the gateway's /health handler checks it
// (gateway/src/controllers/health.controller.ts).
const DEPENDENCIES: Dependency[] = [
    {
        component: "gateway",
        name: "GATEWAY",
        port: ":3000",
        responsibility: "Request IDs, rate limiting, caching, routing, retries, circuit breaking",
        probe: "self-reported",
    },
    {
        component: "redis",
        name: "REDIS",
        port: ":6379",
        responsibility: "Rate-limit counters and the GET /api/products cache",
        probe: "PING → PONG",
    },
    {
        component: "userService",
        name: "USER SERVICE",
        port: ":3001",
        responsibility: "Users, register and login (issues JWTs) · Postgres",
        probe: "GET /users/health",
    },
    {
        component: "productService",
        name: "PRODUCT SERVICE",
        port: ":3002",
        responsibility: "Product catalogue · Postgres",
        probe: "GET /products/health",
    },
];

function readStatus(health: Health, component: HealthComponent): ServiceStatus {
    if (component === "gateway" || component === "redis") return health[component];
    return health.services[component];
}

function statusCell(health: Health | null, unavailable: boolean, component: HealthComponent) {
    // When /health fails we cannot see downstream state, so we say so instead
    // of showing the last known value as if it were current.
    if (unavailable) return component === "gateway"
        ? { label: "UNREACHABLE", tone: "bad" }
        : { label: "UNKNOWN", tone: "idle" };
    if (!health) return { label: "PENDING", tone: "idle" };
    const status = readStatus(health, component);
    return status === "healthy" ? { label: "HEALTHY", tone: "ok" } : { label: "UNHEALTHY", tone: "bad" };
}

function SystemStatus({ health, unavailable, samples, rttMs }: SystemStatusProps) {
    const healthyCount = health && !unavailable
        ? DEPENDENCIES.filter((d) => readStatus(health, d.component) === "healthy").length
        : null;

    return (
        <Panel
            id="health-matrix"
            title="DEPENDENCY HEALTH MATRIX"
            subtitle="The gateway's /health handler probes Redis and both services, then reports all four."
            meta={
                <>
                    <span className="meta-figure">
                        PROBE RTT <b>{rttMs === null ? "—" : `${rttMs.toFixed(0)} ms`}</b> <Tag kind="derived" />
                    </span>
                    <span className="meta-figure">
                        {healthyCount === null ? "— / 4" : `${healthyCount} / 4`} HEALTHY <Tag kind="live" source="/health" />
                    </span>
                </>
            }
        >
            <div className="table-scroll">
                <table className="matrix">
                    <thead>
                        <tr>
                            <th scope="col">SERVICE</th>
                            <th scope="col">RESPONSIBILITY</th>
                            <th scope="col">PROBE</th>
                            <th scope="col">SESSION UPTIME <Tag kind="derived" /></th>
                            <th scope="col" className="align-end">STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {DEPENDENCIES.map((dependency) => {
                            const status = statusCell(health, unavailable, dependency.component);
                            const uptime = observedUptime(samples, dependency.component);
                            return (
                                <tr key={dependency.component}>
                                    <th scope="row">
                                        <span className={`square tone-${status.tone}`} aria-hidden="true" />
                                        {dependency.name} <span className="dim">({dependency.port})</span>
                                    </th>
                                    <td className="muted">{dependency.responsibility}</td>
                                    <td className="code">{dependency.probe}</td>
                                    <td>
                                        {uptime.percent === null ? (
                                            <span className="dim">no samples</span>
                                        ) : (
                                            <>
                                                {uptime.percent.toFixed(1)}%
                                                <span className="dim"> of {uptime.samples} polls</span>
                                            </>
                                        )}
                                    </td>
                                    <td className="align-end">
                                        <span className={`badge tone-${status.tone}`}>{status.label}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <p className="footnote">
                Probe RTT is how long this browser waited for /health, which includes the gateway checking
                all three dependencies. It is not a per-service latency. Session uptime counts only the polls
                made since this page was opened.
            </p>
        </Panel>
    );
}

export default SystemStatus;
