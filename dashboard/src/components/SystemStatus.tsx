import type { Health } from "../types";

interface SystemStatusProps { health: Health | null; unavailable: boolean; }

function SystemStatus({ health, unavailable }: SystemStatusProps) {
    if (!health) return <section className="panel system-status" aria-labelledby="system-status-heading"><div className="panel-heading"><div><p className="eyebrow">SYSTEM STATUS</p><h2 id="system-status-heading">Dependency health matrix</h2></div><span className="panel-source">SOURCE /health</span></div><div className="unavailable-state"><strong>{unavailable ? "HEALTH DATA UNAVAILABLE" : "ESTABLISHING HEALTH CHECK"}</strong><span>{unavailable ? "Gateway health endpoint did not respond." : "Waiting for the first gateway response."}</span></div></section>;
    const services = [["GATEWAY", "Ingress and routing", health.gateway], ["REDIS", "Cache dependency", health.redis], ["USER SERVICE", "Downstream service", health.services.userService], ["PRODUCT SERVICE", "Downstream service", health.services.productService]] as const;
    return <section className="panel system-status" aria-labelledby="system-status-heading"><div className="panel-heading"><div><p className="eyebrow">SYSTEM STATUS</p><h2 id="system-status-heading">Dependency health matrix</h2></div><span className="panel-source">SOURCE /health</span></div><div className="status-table" role="table" aria-label="Gateway service health"><div className="status-table__header" role="row"><span role="columnheader">SERVICE</span><span role="columnheader">RESPONSIBILITY</span><span role="columnheader">OBSERVATION</span><span role="columnheader">STATUS</span></div>{services.map(([name, responsibility, status]) => <div className="status-table__row" role="row" key={name}><strong role="cell">{name}</strong><span role="cell">{responsibility}</span><span className="technical-value" role="cell">/health</span><span className={`status-label status-label--${status}`} role="cell"><i />{status.toUpperCase()}</span></div>)}</div></section>;
}

export default SystemStatus;
