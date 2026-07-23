export default function KPICard({
  title,
  value,
  note,
  icon: Icon,
  tone = "blue",
  loading = false,
}) {
  return (
    <article className={`sw-kpi-card sw-kpi-card--${tone}`}>
      <div className="sw-kpi-card-icon">
        <Icon aria-hidden="true" />
      </div>

      <div className="sw-kpi-card-copy">
        <span>{title}</span>
        <strong>{loading ? "—" : value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}
