import { NavLink } from "react-router-dom";
import {
  FaBook,
  FaChartBar,
  FaCog,
  FaTachometerAlt,
  FaTicketAlt,
  FaUserTie,
  FaUsers,
} from "react-icons/fa";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: FaTachometerAlt },
  { name: "Tickets", path: "/tickets", icon: FaTicketAlt },
  { name: "Customers", path: "/customers", icon: FaUsers },
  { name: "Agents", path: "/agents", icon: FaUserTie },
  { name: "Knowledge Base", path: "/knowledge-base", icon: FaBook },
  { name: "Reports", path: "/reports", icon: FaChartBar },
  { name: "Settings", path: "/settings", icon: FaCog },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">ServiceWise CRM</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {menuItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `sidebar-link${isActive ? " sidebar-link-active" : ""}`
            }
          >
            <Icon aria-hidden="true" />
            <span>{name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
