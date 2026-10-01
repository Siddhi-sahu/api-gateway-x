import type { Health } from "../types";
import { API_URL } from "../lib/api";
import { formatClock } from "../lib/derive";
import { POLL_INTERVAL_MS } from "../lib/gatewayConfig";

interface HeaderProps {
    health: Health | null;
    healthUnavailable: boolean;
    lastSync: Date | null;
    isRefreshing: boolean;
}

function getGatewayState(health: Health | null, healthUnavailable: boolean) {
    if (healthUnavailable) return { label: "GATEWAY UNREACHABLE", tone: "bad" };
    if (!health) return { label: "AWAITING HEALTH", tone: "idle" };
    const values = [health.gateway, health.redis, health.services.userService, health.services.productService];
    return values.every((status) => status === "healthy")
        ? { label: "OPERATIONAL", tone: "ok" }
        : { label: "DEGRADED", tone: "warn" };
}

function Header({ health, healthUnavailable, lastSync, isRefreshing }: HeaderProps) {
    const state = getGatewayState(health, healthUnavailable);
    const target = API_URL.replace(/^https?:\/\//, "");

    return (
        <header className="topbar">
            <div className="topbar__brand">
                <strong>API GATEWAY X</strong>
                <span aria-hidden="true">/</span>
                <em>CONTROL PLANE</em>
            </div>
            <div className={`topbar__state tone-${state.tone}`} role="status">
                <i className={isRefreshing ? "pulse-dot is-live" : "pulse-dot"} aria-hidden="true" />
                {state.label}
            </div>
            <dl className="topbar__meta">
                <div><dt>ENV</dt><dd>LOCAL</dd></div>
                <div><dt>TARGET</dt><dd>{target}</dd></div>
                <div><dt>POLL</dt><dd>{POLL_INTERVAL_MS / 1000}s</dd></div>
                <div><dt>LAST SYNC</dt><dd>{formatClock(lastSync)}</dd></div>
            </dl>
        </header>
    );
}

export default Header;
