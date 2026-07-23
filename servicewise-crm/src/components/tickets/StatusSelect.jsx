export default function StatusSelect({ value, onChange }) {
  const statuses = ["Open", "In Progress", "Pending", "Resolved", "Closed"];
  return <select value={value} onChange={(event) => onChange(event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select>;
}
