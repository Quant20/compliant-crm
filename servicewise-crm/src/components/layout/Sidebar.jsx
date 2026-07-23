import { NavLink } from "react-router-dom";
import {
  FaBook,
  FaChartBar,
  FaCog,
  FaTachometerAlt,
  FaTicketAlt,
  FaUserTie,
  FaUsers,
  FaWhatsapp,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";

const menuItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: FaTachometerAlt,
  },
  {
    name: "Tickets",
    path: "/tickets",
    icon: FaTicketAlt,
  },
  {
    name: "WhatsApp Inbox",
    path: "/whatsapp-inbox",
    icon: FaWhatsapp,
  },
  {
    name: "Customers",
    path: "/customers",
    icon: FaUsers,
  },
  {
    name: "Agents",
    path: "/agents",
    icon: FaUserTie,
    adminOnly: true,
  },
  {
    name: "Knowledge Base",
    path: "/knowledge-base",
    icon: FaBook,
  },
  {
    name: "Reports",
    path: "/reports",
    icon: FaChartBar,
    adminOnly: true,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: FaCog,
    adminOnly: true,
  },
];

function isAdminRole(role) {
  return [
    "admin",
    "administrator",
    "system administrator",
  ].includes(String(role || "").trim().toLowerCase());
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onNavigate,
}) {
  const { currentUser } = useAuth();
  const isAdmin = isAdminRole(currentUser?.role);

  const visibleMenuItems = menuItems.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  const className = [
    "crm-sidebar",
    collapsed ? "collapsed" : "",
    mobileOpen ? "open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={className}>
      <div className="crm-sidebar-brand">
        <div className="crm-sidebar-logo" aria-hidden="true">
          SW
        </div>

        <div className="crm-sidebar-brand-text">
          <strong>ServiceWise CRM</strong>
          <span>Complaint Management</span>
        </div>
      </div>

      <nav className="crm-sidebar-nav" aria-label="Main navigation">
        <p className="crm-sidebar-section-label">Workspace</p>

        {visibleMenuItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            title={collapsed ? name : undefined}
            onClick={onNavigate}
            className={({ isActive }) =>
              `crm-sidebar-link${isActive ? " active" : ""}`
            }
          >
            <Icon aria-hidden="true" />
            <span>{name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="crm-sidebar-session">
        <span className="crm-sidebar-session-dot" />
        <div>
          <strong>{currentUser?.role || "User"}</strong>
          <span>Authenticated session</span>
        </div>
      </div>
    </aside>
  );
}
