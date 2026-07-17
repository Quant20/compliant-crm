import KPIGrid from "../../components/dashboard/KPIGrid";
import RecentTickets from "../../components/dashboard/RecentTickets";
import QuickActions from "../../components/dashboard/QuickActions";
import RecentActivity from "../../components/dashboard/RecentActivity";

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      <KPIGrid />

      <div className="dashboard-grid">
        <RecentTickets />
        <QuickActions />
      </div>

      <RecentActivity />
    </div>
  );
}