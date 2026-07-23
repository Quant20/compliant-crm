import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "../components/layout/Layout";
import Agents from "../pages/Agents/Agents";
import Customers from "../pages/Customers/Customers";
import Dashboard from "../pages/Dashboard/Dashboard";
import KnowledgeBase from "../pages/KnowledgeBase/KnowledgeBase";
import Reports from "../pages/Reports/Reports";
import Settings from "../pages/Settings/Settings";
import TicketDetails from "../pages/TicketDetails/TicketDetails";
import Tickets from "../pages/Tickets/Tickets";
import WhatsAppInbox from "../pages/WhatsAppInbox/WhatsAppInbox";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/tickets/:ticketId" element={<TicketDetails />} />
        <Route path="/whatsapp-inbox" element={<WhatsAppInbox />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
