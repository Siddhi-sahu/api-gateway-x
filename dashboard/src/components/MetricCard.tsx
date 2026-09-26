interface MetricCardProps {
    label: string;
    value: string | number;
}

function MetricCard({ label, value }: MetricCardProps) {
    return (
        <div className="metric-card">
            <p>{label}</p>
            <h2>{value}</h2>
        </div>
    );
}

export default MetricCard;