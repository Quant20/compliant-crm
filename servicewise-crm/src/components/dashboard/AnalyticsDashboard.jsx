import "./AnalyticsDashboard.css";

export default function AnalyticsDashboard({
  stats,
}) {
  const rows = [
    {
      label: "Total",
      value: stats.total,
      tone: "default",
    },
    {
      label: "Open",
      value: stats.open,
      tone: "default",
    },
    {
      label: "In progress",
      value: stats.inProgress,
      tone: "default",
    },
    {
      label: "Pending",
      value: stats.pending,
      tone: "default",
    },
    {
      label: "Resolved",
      value: stats.resolved,
      tone: "default",
    },
    {
      label: "Within SLA",
      value: stats.slaWithin,
      tone: "success",
    },
    {
      label: "Near deadline",
      value: stats.slaNearDue,
      tone: "warning",
    },
    {
      label: "SLA overdue",
      value: stats.slaBreached,
      tone: "danger",
    },
  ];

  return (
    <section className="sw-analytics-dashboard">
      <div className="sw-analytics-heading">
        <div>
          <p>Live Analytics</p>

          <h3>
            Ticket workload and SLA health
          </h3>
        </div>

        <span>
          {stats.resolutionRate}% resolution rate
        </span>
      </div>

      <div className="sw-analytics-scroll">
        <div className="sw-analytics-row">
          {rows.map((item) => (
            <article
              key={item.label}
              className={`sw-analytics-cell sw-analytics-cell--${item.tone}`}
            >
              <span>{item.label}</span>

              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
