export default function PriorityBadge({ priority = "Unknown" }) {
  const priorityClass = priority.toLowerCase().replace(/\s+/g, "-");
  return <span className={`priority-badge priority-${priorityClass}`}>{priority}</span>;
}
