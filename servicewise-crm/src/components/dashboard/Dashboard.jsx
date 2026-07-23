import KPIGrid from "./KPIGrid";
import QuickActions from "./QuickActions";
import RecentTickets from "./RecentTickets";
import RecentActivity from "./RecentActivity";
import { getDashboardStats } from "../../data/dashboardData";

function Dashboard({ tickets = [], onCreateTicket }) {
  const stats = getDashboardStats(tickets);

  return (
    <div className="dashboard-overview">
      <KPIGrid stats={stats} />

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <QuickActions onCreateTicket={onCreateTicket} />
        </section>

        <section className="dashboard-panel">
          <RecentActivity tickets={tickets} />
        </section>
      </div>

      <section className="dashboard-panel">
        <RecentTickets tickets={tickets} />
      </section>
    </div>
  );
}

export default Dashboard;
