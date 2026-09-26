interface StatusCardProps {
    name: string;
    status: "healthy" | "unhealthy";
}

function StatusCard({ name, status }: StatusCardProps) {
    const isHealthy = status === "healthy";

    return (
        <div className="status-card">
            <div>
                <p>{name}</p>
                <span className={isHealthy ? "healthy" : "unhealthy"}>
                    ● {status.toUpperCase()}
                </span>
            </div>
        </div>
    );
}

export default StatusCard;