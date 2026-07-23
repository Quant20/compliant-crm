import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "../components/auth/ProtectedRoute";
import Layout from "../components/layout/Layout";
import Agents from "../pages/Agents/Agents";
import Customers from "../pages/Customers/Customers";
import Dashboard from "../pages/Dashboard/Dashboard";
import HelpCenter from "../pages/HelpCenter/HelpCenter";
import Login from "../pages/Login/Login";
import Reports from "../pages/Reports/Reports";
import Settings from "../pages/Settings/Settings";
import TicketDetails from "../pages/TicketDetails/TicketDetails";
import Tickets from "../pages/Tickets/Tickets";
import Unauthorized from "../pages/Unauthorized/Unauthorized";
import WhatsAppInbox from "../pages/WhatsAppInbox/WhatsAppInbox";

const ADMIN_ROLES = [
  "Admin",
  "Administrator",
  "System Administrator",
];

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route
            path="/tickets/:ticketId"
            element={<TicketDetails />}
          />
          <Route
            path="/whatsapp-inbox"
            element={<WhatsAppInbox />}
          />
          <Route path="/customers" element={<Customers />} />
          <Route path="/help-center" element={<HelpCenter />} />

          <Route
            path="/knowledge-base"
            element={<Navigate to="/help-center" replace />}
          />

          <Route
            element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}
          >
            <Route path="/agents" element={<Agents />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Route>

      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}
