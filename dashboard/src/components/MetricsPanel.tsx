import type { Metrics } from "../types";

interface MetricsPanelProps { metrics: Metrics | null; unavailable: boolean; }
interface MetricValueProps { label: string; value: string | number; tone?: "default" | "danger"; }
function MetricValue({ label, value, tone = "default" }: MetricValueProps) { return <div className={`metric-value metric-value--${tone}`}><span>{label}</span><strong>{value}</strong></div>; }

function MetricsPanel({ metrics, unavailable }: MetricsPanelProps) {
    if (!metrics) return <section className="panel metrics-panel" aria-labelledby="metrics-heading"><div className="panel-heading"><div><p className="eyebrow">REQUEST METRICS</p><h2 id="metrics-heading">Gateway counters</h2></div><span className="panel-source">SOURCE /metrics</span></div><div className="unavailable-state"><strong>{unavailable ? "METRICS UNAVAILABLE" : "LOADING COUNTERS"}</strong><span>{unavailable ? "Gateway metrics endpoint did not respond." : "Waiting for the first gateway response."}</span></div></section>;
    const cacheTotal = metrics.cacheHits + metrics.cacheMisses;
    const cacheHitRate = cacheTotal === 0 ? 0 : (metrics.cacheHits / cacheTotal) * 100;
    const successfulRequests = Math.max(metrics.requestsTotal - metrics.requestsFailed, 0);
    const successRate = metrics.requestsTotal === 0 ? 0 : (successfulRequests / metrics.requestsTotal) * 100;
    const averageLatency = metrics.requestsTotal === 0 ? 0 : metrics.totalLatencyMs / metrics.requestsTotal;
    return <section className="panel metrics-panel" aria-labelledby="metrics-heading"><div className="panel-heading"><div><p className="eyebrow">REQUEST METRICS</p><h2 id="metrics-heading">Gateway counters</h2></div><span className="panel-source">CUMULATIVE SINCE START</span></div><div className="metric-groups"><div className="metric-group"><h3>TRAFFIC</h3><div className="metric-group__values"><MetricValue label="REQUESTS" value={metrics.requestsTotal} /><MetricValue label="SUCCESS RATE" value={`${successRate.toFixed(1)}%`} /><MetricValue label="FAILED" value={metrics.requestsFailed} tone="danger" /><MetricValue label="AVG LATENCY" value={`${averageLatency.toFixed(0)} ms`} /></div></div><div className="metric-group"><h3>CACHE</h3><div className="metric-group__values"><MetricValue label="HIT RATE" value={`${cacheHitRate.toFixed(1)}%`} /><MetricValue label="HITS" value={metrics.cacheHits} /><MetricValue label="MISSES" value={metrics.cacheMisses} /><MetricValue label="CACHE LOOKUPS" value={cacheTotal} /></div></div></div></section>;
}
export default MetricsPanel;
