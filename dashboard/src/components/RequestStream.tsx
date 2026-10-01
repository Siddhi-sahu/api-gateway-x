import { useState } from "react";
import type { RequestRecord } from "../types";
import { formatClock } from "../lib/derive";
import { EmptyState, Panel, Tag } from "./ui";

interface RequestStreamProps {
    requests: RequestRecord[];
    unavailable: boolean;
}

function statusTone(statusCode: number) {
    if (statusCode >= 500) return "bad";
    if (statusCode >= 400) return "warn";
    return "ok";
}

function latencyTone(durationMs: number) {
    if (durationMs >= 1000) return "bad";
    if (durationMs >= 300) return "warn";
    return "plain";
}

/** Recent proxied requests shown as log lines. Click a request id to copy it. */
function RequestStream({ requests, unavailable }: RequestStreamProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copy = (requestId: string) => {
        void navigator.clipboard?.writeText(requestId).then(() => {
            setCopiedId(requestId);
            window.setTimeout(() => setCopiedId((current) => (current === requestId ? null : current)), 1200);
        });
    };

    return (
        <Panel
            id="request-trace"
            title="REQUEST TRACE"
            subtitle="Last 10 requests through the gateway, newest first. The gateway leaves out its own observability endpoints."
            meta={<Tag kind="live" source="/recent-requests" />}
        >
            {unavailable ? (
                <EmptyState tone="bad" title="TRACE UNAVAILABLE" detail="GET /recent-requests did not respond." />
            ) : requests.length === 0 ? (
                <EmptyState
                    title="NO REQUESTS RECORDED YET"
                    detail="No traffic sent through the gateway."
                />
            ) : (
                <ol className="trace">
                    {requests.map((request) => (
                        <li className="trace__line" key={`${request.requestId}-${request.timestamp}`}>
                            <time className="dim" dateTime={request.timestamp}>[{formatClock(request.timestamp, true)}]</time>
                            <span className={`trace__status tone-${statusTone(request.statusCode)}`}>{request.statusCode}</span>
                            <span className={`method method--${request.method.toLowerCase()}`}>{request.method}</span>
                            <span className="trace__route">{request.route}</span>
                            <span className={`trace__latency tone-${latencyTone(request.durationMs)}`}>{request.durationMs}ms</span>
                            <button
                                type="button"
                                className="trace__id"
                                title={`${request.requestId} (click to copy)`}
                                onClick={() => copy(request.requestId)}
                            >
                                {copiedId === request.requestId ? "copied" : `req=${request.requestId.slice(0, 8)}`}
                            </button>
                        </li>
                    ))}
                </ol>
            )}
        </Panel>
    );
}

export default RequestStream;
