import { useEffect, useState } from "react";
import type { Health, Metrics } from "../types";
import { getHealth, getMetrics } from "../lib/api";
import StatusCard from "./StatusCard";
import MetricCard from "./MetricCard";

function Dashboard() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [health, setHealth] = useState<Health | null>(null);

    async function loadDashboard() {
        try{
            const [metricsData, healthData] = await Promise.all([
                getMetrics(),
                getHealth()
            ]);

            setMetrics(metricsData);
            setHealth(healthData);

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

    return (
        <main className="dashboard">
            <header>
                <h1>API Gateway</h1>
                <p>System monitoring dashboard</p>
            </header>

            <section>
                <h2>System Status</h2>

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
                <h2>Metrics</h2>

                <div className="metrics-grid">
                    <MetricCard
                        label="Requests"
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