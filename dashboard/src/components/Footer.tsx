import type { EndpointErrors, EndpointKey } from "../types";
import { API_URL } from "../lib/api";
import { HISTORY_LIMIT } from "../lib/derive";

interface FooterProps {
    errors: EndpointErrors;
    pollCount: number;
    sampleCount: number;
}

const ENDPOINTS: { key: EndpointKey; path: string }[] = [
    { key: "health", path: "/health" },
    { key: "metrics", path: "/metrics" },
    { key: "requests", path: "/recent-requests" },
    { key: "circuits", path: "/circuit-breakers" },
];

/** Bottom status bar: did each endpoint answer on the last poll? */
function Footer({ errors, pollCount, sampleCount }: FooterProps) {
    const port = new URL(API_URL).port || "80";

    return (
        <footer className="statusbar">
            <span className="statusbar__target">[ GATEWAY :{port} ]</span>
            <ul className="statusbar__endpoints" aria-label="Endpoint status on last poll">
                {ENDPOINTS.map(({ key, path }) => {
                    const state = pollCount === 0 ? "WAIT" : errors[key] ? "ERR" : "OK";
                    const tone = state === "OK" ? "ok" : state === "ERR" ? "bad" : "idle";
                    return (
                        <li key={key}>
                            {path} <b className={`tone-${tone}`}>{state}</b>
                        </li>
                    );
                })}
            </ul>
            <span className="statusbar__samples">
                BUFFER {Math.min(sampleCount, HISTORY_LIMIT + 1)}/{HISTORY_LIMIT + 1} SAMPLES · POLLS {pollCount}
            </span>
        </footer>
    );
}

export default Footer;
