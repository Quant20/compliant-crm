import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaTicketAlt,
  FaUsers,
  FaUserTie,
  FaBook,
  FaChartBar,
  FaCog,
} from "react-icons/fa";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: <FaTachometerAlt /> },
  { name: "Tickets", path: "/tickets", icon: <FaTicketAlt /> },
  { name: "Customers", path: "/customers", icon: <FaUsers /> },
  { name: "Agents", path: "/agents", icon: <FaUserTie /> },
  { name: "Knowledge Base", path: "/knowledge-base", icon: <FaBook /> },
  { name: "Reports", path: "/reports", icon: <FaChartBar /> },
  { name: "Settings", path: "/settings", icon: <FaCog /> },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: "260px",
        background: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        padding: "24px",
      }}
    >
      <h2
        style={{
          color: "#0f766e",
          marginBottom: "30px",
        }}
      >
        ServiceWise CRM
      </h2>

      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          style={({ isActive }) => ({
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px",
            marginBottom: "8px",
            borderRadius: "8px",
            textDecoration: "none",
            color: isActive ? "#ffffff" : "#374151",
            background: isActive ? "#0f766e" : "transparent",
            fontWeight: 500,
          })}
        >
          {item.icon}
          {item.name}
        </NavLink>
      ))}
    </aside>
  );
}