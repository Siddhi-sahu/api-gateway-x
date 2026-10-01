import type { ReactNode } from "react";
import type { Metrics, Tick } from "../types";
import {
    HISTORY_LIMIT,
    asciiBar,
    averageLatency,
    cacheHitRate,
    cacheLookups,
    failureRate,
    formatClock,
    formatNumber,
    perSecond,
    successRate,
    sumTicks,
} from "../lib/derive";
import { DASHBOARD_REQUESTS_PER_POLL, POLL_INTERVAL_MS, cacheConfig } from "../lib/gatewayConfig";
import { EmptyState, Panel, Tag } from "./ui";

interface MetricsPanelProps {
    metrics: Metrics | null;
    unavailable: boolean;
    ticks: Tick[];
    counterResetAt: number | null;
}

interface StatProps {
    label: string;
    value: string;
    unit?: string;
    detail: ReactNode;
    tone?: string;
}

function Stat({ label, value, unit, detail, tone = "plain" }: StatProps) {
    return (
        <div className="stat">
            <span className="stat__label">{label}</span>
            <strong className={`stat__value tone-${tone}`}>
                {value}
                {unit ? <small>{unit}</small> : null}
            </strong>
            <span className="stat__detail">{detail}</span>
        </div>
    );
}

/** One bar per poll. Slots with no sample yet stay as empty placeholders. */
function ThroughputStrip({ ticks }: { ticks: Tick[] }) {
    const peak = Math.max(1, ...ticks.map((tick) => tick.requests));
    const emptySlots = Math.max(HISTORY_LIMIT - ticks.length, 0);

    return (
        <div className="strip" role="img" aria-label={`Requests per poll for the last ${ticks.length} polls`}>
            {Array.from({ length: emptySlots }, (_, i) => (
                <span className="strip__slot strip__slot--empty" key={`empty-${i}`} />
            ))}
            {ticks.map((tick) => {
                const height = (tick.requests / peak) * 100;
                const failedShare = tick.requests === 0 ? 0 : (tick.failed / tick.requests) * 100;
                return (
                    <span
                        className="strip__slot"
                        key={tick.at}
                        title={`${formatClock(tick.at)}  +${tick.requests} req  (${tick.failed} × 5xx, ${tick.rateLimited} × 429)`}
                    >
                        <span className="strip__bar" style={{ height: `${height}%` }}>
                            {failedShare > 0 ? <span className="strip__fail" style={{ height: `${failedShare}%` }} /> : null}
                        </span>
                    </span>
                );
            })}
        </div>
    );
}

function MetricsPanel({ metrics, unavailable, ticks, counterResetAt }: MetricsPanelProps) {
    const panelProps = {
        id: "request-metrics",
        title: "REQUEST METRICS",
        subtitle: "Gateway ingress counters, cumulative since the gateway process started.",
        meta: <Tag kind="live" source="/metrics" />,
    };

    if (!metrics) {
        return (
            <Panel {...panelProps}>
                {unavailable
                    ? <EmptyState tone="bad" title="METRICS UNAVAILABLE" detail="GET /metrics did not respond. Check that the gateway is running on :3000." />
                    : <EmptyState title="WAITING FOR FIRST SAMPLE" detail="The first /metrics poll has not returned yet." />}
            </Panel>
        );
    }

    const lastTick = ticks.at(-1);
    const recent = sumTicks(ticks);
    const windowRate = perSecond(recent.requests, recent.intervalMs);
    const windowLatency = recent.requests === 0 ? null : recent.latencyMs / recent.requests;
    const success = successRate(metrics);
    const lookups = cacheLookups(metrics);
    const windowMinutes = (recent.intervalMs / 60000).toFixed(1);
    const selfTraffic = DASHBOARD_REQUESTS_PER_POLL / (POLL_INTERVAL_MS / 1000);

    return (
        <Panel {...panelProps}>
            {counterResetAt ? (
                <p className="notice tone-warn">
                    COUNTERS RESET at {formatClock(counterResetAt)}. The gateway restarted, so history was cleared.
                </p>
            ) : null}

            <div className="stats">
                <Stat
                    label="REQUESTS"
                    value={formatNumber(metrics.requestsTotal)}
                    detail={lastTick
                        ? <>+{perSecond(lastTick.requests, lastTick.intervalMs).toFixed(1)} req/s <Tag kind="derived" /></>
                        : <span className="dim">req/s needs 2 samples</span>}
                />
                <Stat
                    label="SUCCESS RATE"
                    value={success.toFixed(1)}
                    unit="%"
                    tone={success < 95 && metrics.requestsTotal > 0 ? "warn" : "ok"}
                    detail={<span className="gauge">{asciiBar(success, 14)}</span>}
                />
                <Stat
                    label="FAILED · 5XX"
                    value={formatNumber(metrics.requestsFailed)}
                    tone={metrics.requestsFailed > 0 ? "bad" : "plain"}
                    detail={`${failureRate(metrics).toFixed(2)}% of total`}
                />
                <Stat
                    label="AVG LATENCY"
                    value={averageLatency(metrics).toFixed(0)}
                    unit="ms"
                    detail={windowLatency === null
                        ? <span className="dim">window avg needs traffic</span>
                        : <>window {windowLatency.toFixed(0)} ms <Tag kind="derived" /></>}
                />
            </div>

            <div className="subpanel">
                <div className="subpanel__head">
                    <span>THROUGHPUT · REQUESTS PER POLL (LAST {HISTORY_LIMIT})</span>
                    <span>
                        {ticks.length === 0 ? "—" : `${windowRate.toFixed(2)} req/s over ${windowMinutes} min`} <Tag kind="derived" />
                    </span>
                </div>
                <ThroughputStrip ticks={ticks} />
                <p className="footnote">
                    Each bar is the growth in requestsTotal between two polls; red marks the 5xx share.
                    Counts include this dashboard's own polling ({DASHBOARD_REQUESTS_PER_POLL} requests every{" "}
                    {POLL_INTERVAL_MS / 1000}s, about {selfTraffic.toFixed(1)} req/s per open tab).
                </p>
            </div>

            <div className="subpanel">
                <div className="subpanel__head">
                    <span>CACHE SUBSYSTEM · REDIS</span>
                    <Tag kind="static" source={`${cacheConfig.route} · TTL ${cacheConfig.ttlSeconds}s`} />
                </div>
                <div className="stats stats--compact">
                    <Stat label="HIT RATE" value={cacheHitRate(metrics).toFixed(1)} unit="%" detail={<span className="gauge">{asciiBar(cacheHitRate(metrics), 10)}</span>} />
                    <Stat label="HITS" value={formatNumber(metrics.cacheHits)} tone="ok" detail={`+${recent.cacheHits} in window`} />
                    <Stat label="MISSES" value={formatNumber(metrics.cacheMisses)} tone={metrics.cacheMisses > 0 ? "warn" : "plain"} detail={`+${recent.cacheMisses} in window`} />
                    <Stat label="LOOKUPS" value={formatNumber(lookups)} detail={<span className="code">{cacheConfig.key}</span>} />
                </div>
            </div>
        </Panel>
    );
}

export default MetricsPanel;
