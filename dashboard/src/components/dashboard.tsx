import { useEffect, useState } from "react";
import type { Health, Metrics } from "../types";
import { getHealth, getMetrics } from "../lib/api";

function Dashboard() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [health, setHealth] = useState<Health | null>(null);

    async function loadDashboard() {
        const [metricsData, healthData] = await Promise.all([
            getMetrics(),
            getHealth()
        ]);

        setMetrics(metricsData);
        setHealth(healthData);
    };

    useEffect(() => {
        loadDashboard();

        const interval = setInterval(
            loadDashboard,
            5000
        );

        return () => clearInterval(interval);
    }, []);

    if (!metrics || !health) {
        return <div>Loading...</div>;
    }

    return (
        // dashboard
    );
};

export default Dashboard;