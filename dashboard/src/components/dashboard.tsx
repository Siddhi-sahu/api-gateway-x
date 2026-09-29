import { useEffect, useState } from "react";
import { type RequestRecord, type Health, type Metrics } from "../types";
import { getHealth, getMetrics, getRecentRequests } from "../lib/api";
import StatusCard from "./StatusCard";
import MetricCard from "./MetricCard";

function Dashboard() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [health, setHealth] = useState<Health | null>(null);
    const [recentRequests, setRecentRequests] = useState<RequestRecord[]>([]);

    async function loadDashboard() {
        try{
            const [metricsData, healthData, requestsData] = await Promise.all([
                getMetrics(),
                getHealth(),
                getRecentRequests()
            ]);

            setMetrics(metricsData);
            setHealth(healthData);
            setRecentRequests(requestsData);

        }catch(e){
            console.error("Failed to load dashboard:", e);

        }
        
    };

    useEffect(() => {
        loadDashboard();

        const interval = setInterval(
            loadDashboard,
            10000
        );

        return () => clearInterval(interval);
    }, []);

    if (!metrics || !health) {
        return <div>Loading...</div>;
    };

    const totalCacheRequests = metrics.cacheHits + metrics.cacheMisses;

    const cacheHitRate = totalCacheRequests === 0 ? 0 : (metrics.cacheHits/totalCacheRequests)*100;

    const averageLatency = metrics.requestsTotal === 0 ? 0 : metrics.totalLatencyMs / metrics.requestsTotal;

    console.log(recentRequests);
    return (
        <main className="dashboard">
            <header>
                <h1>api-gateway-x</h1>
                <p>system monitoring</p>
            </header>

            <section>
                <h2>service status</h2>

                <div className="status-grid">
                    <StatusCard
                        name="Gateway"
                        status={health.gateway}
                    />

                    <StatusCard
                        name="Redis"
                        status={health.redis}
                    />

                    <StatusCard
                        name="User Service"
                        status={health.services.userService}
                    />

                    <StatusCard
                        name="Product Service"
                        status={health.services.productService}
                    />
                </div>
            </section>

            <section>
                <h2>metrics</h2>

                <div className="metrics-grid">
                    <MetricCard
                        label="Requests since gateway restarted"
                        value={metrics.requestsTotal}
                    />

                    <MetricCard
                        label="Errors"
                        value={metrics.requestsFailed}
                    />

                    <MetricCard
                        label="Cache Hit Rate"
                        value={`${cacheHitRate.toFixed(1)}%`}
                    />

                    <MetricCard
                        label="Average Requests Latency"
                        value={`${averageLatency}`}
                    />

                    <MetricCard
                        label="Rate Limited"
                        value={metrics.rateLimitRejected}
                    />

                    <MetricCard
                        label="Retries"
                        value={metrics.retries}
                    />
                </div>
            </section>
        </main>
    );
};

export default Dashboard;