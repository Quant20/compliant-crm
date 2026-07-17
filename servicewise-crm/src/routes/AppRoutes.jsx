import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";

const Dashboard = () => <h1>Dashboard</h1>;
const Tickets = () => <h1>Tickets</h1>;
const Customers = () => <h1>Customers</h1>;
const Agents = () => <h1>Agents</h1>;
const KnowledgeBase = () => <h1>Knowledge Base</h1>;
const Reports = () => <h1>Reports</h1>;
const Settings = () => <h1>Settings</h1>;

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
    path="/dashboard"
    element={
        <Layout>
            <Dashboard />
        </Layout>
    }
/>
      <Route path="/tickets" element={<Tickets />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/agents" element={<Agents />} />
      <Route path="/agents" element={<Agents />} />
      <Route path="/knowledge-base" element={<KnowledgeBase />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}