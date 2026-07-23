import { useMemo, useState } from "react";
import {
  FaPlus,
  FaSyncAlt,
} from "react-icons/fa";

import AnalyticsDashboard from "../../components/dashboard/AnalyticsDashboard";
import KPIGrid from "../../components/dashboard/KPIGrid";
import QuickActions from "../../components/dashboard/QuickActions";
import RecentActivity from "../../components/dashboard/RecentActivity";
import RecentTickets from "../../components/dashboard/RecentTickets";
import CreateTicketModal from "../../components/tickets/CreateTicketModal";
import { useAuth } from "../../context/AuthContext";
import { useTickets } from "../../context/TicketContext";
import {
  getDashboardStats,
  getRecentActivities,
  getRecentTickets,
} from "../../data/dashboardData";

import "./Dashboard.css";

export default function Dashboard() {
  const {
    tickets,
    loading,
    error,
    dataSource,
    loadTickets,
  } = useTickets();
  const { currentUser } = useAuth();

  const [createTicketOpen, setCreateTicketOpen] =
    useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const stats = useMemo(
    () => getDashboardStats(tickets),
    [tickets],
  );

  const recentTickets = useMemo(
    () => getRecentTickets(tickets, 6),
    [tickets],
  );

  const recentActivities = useMemo(
    () => getRecentActivities(tickets, 8),
    [tickets],
  );

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await loadTickets();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="sw-dashboard">
      <section className="sw-dashboard-hero">
        <div>
          <p className="sw-dashboard-eyebrow">
            Complaint Management Overview
          </p>

          <h2>
            Welcome back
            {currentUser?.name
              ? `, ${currentUser.name.split(" ")[0]}`
              : ""}
          </h2>

          <p>
            Track complaints, agent workload and recent customer
            activity from one workspace.
          </p>
        </div>

        <div className="sw-dashboard-hero-actions">
          <span
            className={`sw-dashboard-source sw-dashboard-source--${dataSource}`}
          >
            {dataSource === "supabase"
              ? "Supabase connected"
              : "Local recovery data"}
          </span>

          <button
            type="button"
            className="sw-dashboard-button sw-dashboard-button--secondary"
            onClick={handleRefresh}
            disabled={loading || refreshing}
          >
            <FaSyncAlt
              className={refreshing ? "is-spinning" : ""}
            />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>

          <button
            type="button"
            className="sw-dashboard-button sw-dashboard-button--primary"
            onClick={() => setCreateTicketOpen(true)}
          >
            <FaPlus />
            New Ticket
          </button>
        </div>
      </section>

      {error && (
        <div className="sw-dashboard-alert" role="alert">
          {error}
        </div>
      )}

      <AnalyticsDashboard stats={stats} />

      <KPIGrid stats={stats} loading={loading} />

      <div className="sw-dashboard-main-grid">
        <RecentTickets tickets={recentTickets} />
        <QuickActions
          onCreateTicket={() => setCreateTicketOpen(true)}
        />
      </div>

      <RecentActivity activities={recentActivities} />

      <CreateTicketModal
        open={createTicketOpen}
        onClose={() => setCreateTicketOpen(false)}
      />
    </div>
  );
}
