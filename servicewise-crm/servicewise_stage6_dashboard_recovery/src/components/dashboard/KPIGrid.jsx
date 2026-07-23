import {
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaTicketAlt,
} from "react-icons/fa";

import KPICard from "./KPICard";

export default function KPIGrid({ stats, loading }) {
  const items = [
    {
      id: "total",
      title: "Total Tickets",
      value: stats.total,
      note: "All complaint records",
      icon: FaTicketAlt,
      tone: "blue",
    },
    {
      id: "open",
      title: "Open Tickets",
      value: stats.open,
      note: "Awaiting action",
      icon: FaExclamationTriangle,
      tone: "orange",
    },
    {
      id: "progress",
      title: "In Progress",
      value: stats.inProgress,
      note: "Currently assigned",
      icon: FaClock,
      tone: "teal",
    },
    {
      id: "resolved",
      title: "Resolved",
      value: stats.resolved,
      note: `${stats.resolutionRate}% resolution rate`,
      icon: FaCheckCircle,
      tone: "green",
    },
  ];

  return (
    <div className="sw-kpi-grid">
      {items.map((item) => (
        <KPICard
          key={item.id}
          {...item}
          loading={loading}
        />
      ))}
    </div>
  );
}
