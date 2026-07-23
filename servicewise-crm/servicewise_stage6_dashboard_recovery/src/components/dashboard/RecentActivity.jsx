import { useNavigate } from "react-router-dom";

import { formatDashboardDate } from "../../data/dashboardData";

export default function RecentActivity({ activities }) {
  const navigate = useNavigate();

  return (
    <section className="sw-dashboard-panel">
      <div className="sw-dashboard-panel-header">
        <div>
          <h3>Recent activity</h3>
          <p>Latest changes across complaint tickets</p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="sw-dashboard-empty">
          No activity has been recorded yet.
        </div>
      ) : (
        <div className="sw-activity-list">
          {activities.map((activity) => (
            <button
              type="button"
              className="sw-activity-item"
              key={activity.id}
              onClick={() =>
                activity.ticketId &&
                navigate(`/tickets/${activity.ticketId}`)
              }
            >
              <span className="sw-activity-dot" />

              <span className="sw-activity-copy">
                <strong>{activity.text}</strong>
                <small>
                  {activity.ticketNumber} · {activity.customerName}
                </small>
              </span>

              <span className="sw-activity-meta">
                <strong>{activity.user}</strong>
                <small>
                  {formatDashboardDate(activity.createdAt)}
                </small>
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
