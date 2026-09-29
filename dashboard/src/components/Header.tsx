import type { Health } from "../types";

interface HeaderProps { health: Health | null; healthUnavailable: boolean; lastSync: Date | null; isRefreshing: boolean; }

function getGatewayState(health: Health | null, healthUnavailable: boolean) {
    if (healthUnavailable) return { label: "HEALTH CHECK FAILED", tone: "danger" };
    if (!health) return { label: "AWAITING HEALTH", tone: "pending" };
    const values = [health.gateway, health.redis, health.services.userService, health.services.productService];
    return values.every((status) => status === "healthy") ? { label: "OPERATIONAL", tone: "healthy" } : { label: "DEGRADED", tone: "danger" };
}

function formatLastSync(lastSync: Date | null) {
    if (!lastSync) return "--:--:--";
    return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(lastSync);
}

function Header({ health, healthUnavailable, lastSync, isRefreshing }: HeaderProps) {
    const gatewayState = getGatewayState(health, healthUnavailable);
    return <header className="control-header">
        <div className="control-header__identity"><span className="eyebrow">API GATEWAY</span><h1>CONTROL PLANE</h1></div>
        <dl className="control-header__metadata">
            <div><dt>ENVIRONMENT</dt><dd>LOCAL</dd></div><div><dt>POLL INTERVAL</dt><dd>5 SEC</dd></div><div><dt>LAST SYNC</dt><dd>{formatLastSync(lastSync)}</dd></div>
        </dl>
        <div className={`gateway-state gateway-state--${gatewayState.tone}`}><span className={isRefreshing ? "signal signal--pulse" : "signal"} />{gatewayState.label}</div>
    </header>;
}

export default Header;
