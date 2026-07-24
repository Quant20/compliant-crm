import "./DashboardBreakdowns.css";

function BreakdownPanel({
  title,
  subtitle,
  items,
  type,
  loading,
}) {
  const hasItems = Array.isArray(items) && items.length > 0;

  return (
    <section className="sw-breakdown-panel">
      <div className="sw-breakdown-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>

      {loading ? (
        <div className="sw-breakdown-empty">Loading data…</div>
      ) : !hasItems ? (
        <div className="sw-breakdown-empty">
          No ticket data is available.
        </div>
      ) : (
        <div className="sw-breakdown-list">
          {items.map((item) => (
            <article className="sw-breakdown-item" key={item.key}>
              <div className="sw-breakdown-item-heading">
                <span
                  className={`sw-breakdown-label sw-breakdown-label--${type}-${item.key}`}
                >
                  {item.label}
                </span>

                <strong>{item.value}</strong>
              </div>

              <div className="sw-breakdown-track">
                <span
                  className={`sw-breakdown-fill sw-breakdown-fill--${type}-${item.key}`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>

              <small>{item.percentage}% of tickets</small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function DashboardBreakdowns({
  priorityItems,
  categoryItems,
  loading,
}) {
  return (
    <div className="sw-breakdown-grid">
      <BreakdownPanel
        title="Tickets by Priority"
        subtitle="Complaint urgency distribution"
        items={priorityItems}
        type="priority"
        loading={loading}
      />

      <BreakdownPanel
        title="Complaints by Category"
        subtitle="Most common complaint types"
        items={categoryItems}
        type="category"
        loading={loading}
      />
    </div>
  );
}
