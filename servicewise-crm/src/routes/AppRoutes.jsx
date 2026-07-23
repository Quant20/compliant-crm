import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "../components/layout/Layout";
import Dashboard from "../pages/Dashboard/Dashboard";
import Tickets from "../pages/Tickets/Tickets";
import TicketDetails from "../pages/TicketDetails/TicketDetails";
import WhatsAppInbox from "../pages/WhatsAppInbox/WhatsAppInbox";

function RecoveryPendingPage({ title }) {
  return (
    <section className="crm-page-container">
      <div className="crm-detail-panel crm-recovery-placeholder">
        <p className="crm-recovery-eyebrow">RECOVERY IN PROGRESS</p>
        <h1>{title}</h1>
        <p>
          This section is preserved in the project structure, but its latest
          page component still needs to be restored.
        </p>
      </div>
    </section>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/tickets/:ticketId" element={<TicketDetails />} />
        <Route path="/whatsapp-inbox" element={<WhatsAppInbox />} />

        <Route
          path="/customers"
          element={<RecoveryPendingPage title="Customers" />}
        />
        <Route
          path="/agents"
          element={<RecoveryPendingPage title="Agents" />}
        />
        <Route
          path="/knowledge-base"
          element={<RecoveryPendingPage title="Knowledge Base" />}
        />
        <Route
          path="/reports"
          element={<RecoveryPendingPage title="Reports" />}
        />
        <Route
          path="/settings"
          element={<RecoveryPendingPage title="Settings" />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
