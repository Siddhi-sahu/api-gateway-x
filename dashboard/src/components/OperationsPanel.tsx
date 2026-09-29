import type { CircuitBreakers, Health, Metrics } from "../types";

interface OperationsPanelProps {
    health: Health | null;
    metrics: Metrics | null;
    circuitBreakers: CircuitBreakers | null;
    healthUnavailable: boolean;
    metricsUnavailable: boolean;
    circuitsUnavailable: boolean;
}

function valueOrUnavailable(value: string | number | undefined, unavailable: boolean) {
    return unavailable || value === undefined ? "UNAVAILABLE" : value;
}

function OperationsPanel({ health, metrics, circuitBreakers, healthUnavailable, metricsUnavailable, circuitsUnavailable }: OperationsPanelProps) {
    const operations = [
        { label: "REDIS CACHE", value: valueOrUnavailable(health?.redis?.toUpperCase(), healthUnavailable), tone: health?.redis === "unhealthy" ? "danger" : "healthy" },
        { label: "RATE LIMIT EVENTS", value: valueOrUnavailable(metrics?.rateLimitRejected, metricsUnavailable), tone: "default" },
        { label: "RETRY EVENTS", value: valueOrUnavailable(metrics?.retries, metricsUnavailable), tone: "default" },
        { label: "USER CIRCUIT", value: valueOrUnavailable(circuitBreakers?.userService, circuitsUnavailable), tone: circuitBreakers?.userService === "OPEN" ? "danger" : "healthy" },
        { label: "PRODUCT CIRCUIT", value: valueOrUnavailable(circuitBreakers?.productService, circuitsUnavailable), tone: circuitBreakers?.productService === "OPEN" ? "danger" : "healthy" },
    ];
    return <aside className="panel operations-panel" aria-labelledby="operations-heading"><div className="panel-heading"><div><p className="eyebrow">GATEWAY OPERATIONS</p><h2 id="operations-heading">Protection mechanisms</h2></div><span className="panel-source">LIVE STATE</span></div><div className="operations-list">{operations.map((operation) => <div className="operation-row" key={operation.label}><span>{operation.label}</span><strong className={`operation-row__value operation-row__value--${operation.tone}`}>{operation.value}</strong></div>)}</div></aside>;
}

export default OperationsPanel;
