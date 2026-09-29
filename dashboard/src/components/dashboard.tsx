import { useCallback, useEffect, useState } from "react";
import type { CircuitBreakers, Health, Metrics, RequestRecord } from "../types";
import {
    getCircuitBreakers,
    getHealth,
    getMetrics,
    getRecentRequests,
} from "../lib/api";
import Header from "./Header";
import MetricsPanel from "./MetricsPanel";
import OperationsPanel from "./OperationsPanel";
import RequestStream from "./RequestStream";
import SystemStatus from "./SystemStatus";

function Dashboard() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [health, setHealth] = useState<Health | null>(null);
    const [recentRequests, setRecentRequests] = useState<RequestRecord[]>([]);
    const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreakers | null>(null);
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(true);

    const loadDashboard = useCallback(async () => {
        setIsRefreshing(true);

        const [metricsResult, healthResult, requestsResult, circuitsResult] =
            await Promise.allSettled([
                getMetrics(),
                getHealth(),
                getRecentRequests(),
                getCircuitBreakers(),
            ]);

        const nextErrors: Record<string, boolean> = {};
        let hasSuccessfulResult = false;

        if (metricsResult.status === "fulfilled") {
            setMetrics(metricsResult.value as Metrics);
            hasSuccessfulResult = true;
        } else {
            nextErrors.metrics = true;
        }

        if (healthResult.status === "fulfilled") {
            setHealth(healthResult.value as Health);
            hasSuccessfulResult = true;
        } else {
            nextErrors.health = true;
        }

        if (requestsResult.status === "fulfilled") {
            setRecentRequests(requestsResult.value as RequestRecord[]);
            hasSuccessfulResult = true;
        } else {
            nextErrors.requests = true;
        }

        if (circuitsResult.status === "fulfilled") {
            setCircuitBreakers(circuitsResult.value as CircuitBreakers);
            hasSuccessfulResult = true;
        } else {
            nextErrors.circuits = true;
        }

        setErrors(nextErrors);
        if (hasSuccessfulResult) setLastSync(new Date());
        setIsRefreshing(false);
    }, []);

    useEffect(() => {
        const initialLoad = window.setTimeout(() => void loadDashboard(), 0);
        const interval = window.setInterval(() => void loadDashboard(), 5000);

        return () => {
            window.clearTimeout(initialLoad);
            window.clearInterval(interval);
        };
    }, [loadDashboard]);

    return (
        <main className="control-plane">
            <Header health={health} healthUnavailable={Boolean(errors.health)} lastSync={lastSync} isRefreshing={isRefreshing} />
            <div className="control-plane__body">
                <SystemStatus health={health} unavailable={Boolean(errors.health)} />
                <div className="control-plane__primary-grid">
                    <MetricsPanel metrics={metrics} unavailable={Boolean(errors.metrics)} />
                    <OperationsPanel health={health} metrics={metrics} circuitBreakers={circuitBreakers} healthUnavailable={Boolean(errors.health)} metricsUnavailable={Boolean(errors.metrics)} circuitsUnavailable={Boolean(errors.circuits)} />
                </div>
                <RequestStream requests={recentRequests} unavailable={Boolean(errors.requests)} />
            </div>
        </main>
    );
};

export default Dashboard;
