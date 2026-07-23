export default function StatusBadge({ status = "Unknown" }) {
  const statusClass = status.toLowerCase().replace(/\s+/g, "-");
  return <span className={`status-badge status-${statusClass}`}>{status}</span>;
}
