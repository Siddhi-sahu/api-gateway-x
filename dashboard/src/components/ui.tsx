import type { ReactNode } from "react";

// Small building blocks shared by every panel.

type TagKind = "live" | "derived" | "static";

const TAG_TEXT: Record<TagKind, string> = {
    live: "LIVE",
    derived: "CLIENT-DERIVED",
    static: "STATIC",
};

/**
 * Says where a number comes from:
 * LIVE = straight from a gateway endpoint, CLIENT-DERIVED = computed in the
 * browser from live data, STATIC = copied from gateway source code.
 */
export function Tag({ kind, source }: { kind: TagKind; source?: string }) {
    return (
        <span className={`tag tag--${kind}`} title={source ? `${TAG_TEXT[kind]} · ${source}` : TAG_TEXT[kind]}>
            [{TAG_TEXT[kind]}{source ? <em> {source}</em> : null}]
        </span>
    );
}

interface PanelProps {
    id: string;
    title: string;
    subtitle?: ReactNode;
    meta?: ReactNode;
    className?: string;
    children: ReactNode;
}

export function Panel({ id, title, subtitle, meta, className = "", children }: PanelProps) {
    return (
        <section className={`panel ${className}`} aria-labelledby={id}>
            <header className="panel__head">
                <div>
                    <h2 className="panel__title" id={id}>{title}</h2>
                    {subtitle ? <p className="panel__subtitle">{subtitle}</p> : null}
                </div>
                {meta ? <div className="panel__meta">{meta}</div> : null}
            </header>
            {children}
        </section>
    );
}

export function EmptyState({ title, detail, tone = "idle" }: { title: string; detail: string; tone?: "idle" | "bad" }) {
    return (
        <div className={`empty empty--${tone}`} role="status">
            <strong>{title}</strong>
            <span>{detail}</span>
        </div>
    );
}

/** A labelled line with a value on the right — the control-path row style. */
export function Readout({ label, note, value, tone = "plain" }: { label: string; note?: ReactNode; value: ReactNode; tone?: string }) {
    return (
        <div className="readout">
            <div className="readout__label">
                <span>{label}</span>
                {note ? <small>{note}</small> : null}
            </div>
            <strong className={`readout__value tone-${tone}`}>{value}</strong>
        </div>
    );
}
