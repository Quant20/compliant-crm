function AnalyticsDashboard({ stats }) {
  const rows = [
    ["Total tickets", stats.total],
    ["Open", stats.open],
    ["In progress", stats.inProgress],
    ["Resolved", stats.resolved],
    ["High priority", stats.highPriority],
    ["Unassigned", stats.unassigned],
  ];

  return (
    <section className="analytics-dashboard">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Ticket analytics</h2>
        </div>
        <span className="section-caption">Live from local storage</span>
      </div>

      <div className="analytics-table-wrap">
        <table className="analytics-table">
          <thead>
            <tr>
              {rows.map(([label]) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {rows.map(([label, value]) => (
                <td key={label}>{value}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AnalyticsDashboard;
