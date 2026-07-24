import "./AnalyticsDashboard.css";

export default function AnalyticsDashboard({ stats }) {
  const rows = [
    ["Total", stats.total],
    ["Open", stats.open],
    ["In progress", stats.inProgress],
    ["Pending", stats.pending],
    ["Resolved", stats.resolved],
  ];

  return (
    <section className="sw-analytics-dashboard">
      <div className="sw-analytics-heading">
        <div>
          <p>Live Analytics</p>
          <h3>Ticket workload</h3>
        </div>

        <span>{stats.resolutionRate}% resolution rate</span>
      </div>

      <div className="sw-analytics-scroll">
        <div className="sw-analytics-row">
          {rows.map(([label, value]) => (
            <article className="sw-analytics-cell" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
