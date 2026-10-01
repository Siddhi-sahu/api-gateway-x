import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
    CircuitBreakers,
    CircuitTransition,
    EndpointErrors,
    Health,
    HealthSample,
    Metrics,
    MetricsSample,
    RequestRecord,
} from "../types";
import { getCircuitBreakers, getHealthTimed, getMetrics, getRecentRequests } from "../lib/api";
import { HISTORY_LIMIT, diffCircuits, isCounterReset, toTicks } from "../lib/derive";
import { POLL_INTERVAL_MS } from "../lib/gatewayConfig";
import Footer from "./Footer";
import Header from "./Header";
import MetricsPanel from "./MetricsPanel";
import OperationsPanel from "./OperationsPanel";
import RequestStream from "./RequestStream";
import RoutingTable from "./RoutingTable";
import SystemStatus from "./SystemStatus";

const MAX_TRANSITIONS = 20;

/**
 * Owns all state. Every 5s it calls the four gateway endpoints in parallel,
 * keeps the latest good response of each, and appends to small in-memory
 * histories that the panels use for client-derived values.
 */
function Dashboard() {
    // Latest response from each endpoint (kept even if a later poll fails).
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [health, setHealth] = useState<Health | null>(null);
    const [recentRequests, setRecentRequests] = useState<RequestRecord[]>([]);
    const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreakers | null>(null);
    const [errors, setErrors] = useState<EndpointErrors>({});
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(true);

    // Session history (browser memory only, lost on reload).
    const [metricsSamples, setMetricsSamples] = useState<MetricsSample[]>([]);
    const [healthSamples, setHealthSamples] = useState<HealthSample[]>([]);
    const [transitions, setTransitions] = useState<CircuitTransition[]>([]);
    const [counterResetAt, setCounterResetAt] = useState<number | null>(null);

    const previousMetrics = useRef<Metrics | null>(null);
    const previousCircuits = useRef<CircuitBreakers | null>(null);

    const loadDashboard = useCallback(async () => {
        setIsRefreshing(true);

        const [metricsResult, healthResult, requestsResult, circuitsResult] =
            await Promise.allSettled([
                getMetrics(),
                getHealthTimed(),
                getRecentRequests(),
                getCircuitBreakers(),
            ]);

        const at = Date.now();
        const nextErrors: EndpointErrors = {};
        let hasSuccessfulResult = false;

        if (metricsResult.status === "fulfilled") {
            const next = metricsResult.value;
            const wasReset = previousMetrics.current !== null && isCounterReset(previousMetrics.current, next);
            previousMetrics.current = next;

            setMetrics(next);
            // A reset makes deltas meaningless, so history starts over.
            setMetricsSamples((samples) => wasReset
                ? [{ at, metrics: next }]
                : [...samples, { at, metrics: next }].slice(-(HISTORY_LIMIT + 1)));
            if (wasReset) setCounterResetAt(at);
            hasSuccessfulResult = true;
        } else {
            nextErrors.metrics = true;
        }

        if (healthResult.status === "fulfilled") {
            setHealth(healthResult.value.data);
            hasSuccessfulResult = true;
        } else {
            nextErrors.health = true;
        }
        const healthSample: HealthSample = healthResult.status === "fulfilled"
            ? { at, health: healthResult.value.data, rttMs: healthResult.value.rttMs }
            : { at, health: null, rttMs: null };
        setHealthSamples((samples) => [...samples, healthSample].slice(-HISTORY_LIMIT));

        if (requestsResult.status === "fulfilled") {
            setRecentRequests(requestsResult.value);
            hasSuccessfulResult = true;
        } else {
            nextErrors.requests = true;
        }

        if (circuitsResult.status === "fulfilled") {
            const next = circuitsResult.value;
            const changes = previousCircuits.current ? diffCircuits(previousCircuits.current, next, at) : [];
            previousCircuits.current = next;

            setCircuitBreakers(next);
            if (changes.length > 0) {
                setTransitions((list) => [...changes, ...list].slice(0, MAX_TRANSITIONS));
            }
            hasSuccessfulResult = true;
        } else {
            nextErrors.circuits = true;
        }

        setErrors(nextErrors);
        if (hasSuccessfulResult) setLastSync(new Date(at));
        setIsRefreshing(false);
    }, []);

    useEffect(() => {
        const initialLoad = window.setTimeout(() => void loadDashboard(), 0);
        const interval = window.setInterval(() => void loadDashboard(), POLL_INTERVAL_MS);

        return () => {
            window.clearTimeout(initialLoad);
            window.clearInterval(interval);
        };
    }, [loadDashboard]);

    const ticks = useMemo(() => toTicks(metricsSamples), [metricsSamples]);
    const latestHealthSample = healthSamples.at(-1) ?? null;

    return (
        <div className="shell">
            <Header
                health={health}
                healthUnavailable={Boolean(errors.health)}
                lastSync={lastSync}
                isRefreshing={isRefreshing}
            />
            <main className="deck">
                <SystemStatus
                    health={health}
                    unavailable={Boolean(errors.health)}
                    samples={healthSamples}
                    rttMs={latestHealthSample?.rttMs ?? null}
                />
                <div className="deck__grid">
                    <MetricsPanel
                        metrics={metrics}
                        unavailable={Boolean(errors.metrics)}
                        ticks={ticks}
                        counterResetAt={counterResetAt}
                    />
                    <OperationsPanel
                        health={health}
                        metrics={metrics}
                        circuitBreakers={circuitBreakers}
                        healthUnavailable={Boolean(errors.health)}
                        metricsUnavailable={Boolean(errors.metrics)}
                        circuitsUnavailable={Boolean(errors.circuits)}
                        ticks={ticks}
                        transitions={transitions}
                    />
                </div>
                <RoutingTable
                    health={health}
                    circuitBreakers={circuitBreakers}
                    ticks={ticks}
                    metricsUnavailable={Boolean(errors.metrics)}
                />
                <RequestStream requests={recentRequests} unavailable={Boolean(errors.requests)} />
            </main>
            <Footer errors={errors} pollCount={healthSamples.length} sampleCount={metricsSamples.length} />
        </div>
    );
}

export default Dashboard;
