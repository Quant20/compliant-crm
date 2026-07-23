import {
  FaBars,
  FaBell,
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
} from "react-icons/fa";
import { useLocation } from "react-router-dom";

const titles = {
  "/dashboard": "Dashboard",
  "/tickets": "Tickets",
  "/whatsapp-inbox": "WhatsApp Inbox",
  "/customers": "Customers",
  "/agents": "Agents",
  "/knowledge-base": "Knowledge Base",
  "/reports": "Reports",
  "/settings": "Settings",
};

function getPageTitle(pathname) {
  if (pathname.startsWith("/tickets/")) {
    return "Ticket Details";
  }

  return titles[pathname] || "ServiceWise CRM";
}

export default function Header({
  sidebarCollapsed,
  onToggleSidebar,
  onOpenMobileSidebar,
}) {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);

  return (
    <header className="crm-header">
      <div className="crm-header-left">
        <button
          type="button"
          className="crm-sidebar-toggle crm-desktop-sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>

        <button
          type="button"
          className="crm-sidebar-toggle crm-mobile-sidebar-toggle"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation"
        >
          <FaBars />
        </button>

        <div className="crm-header-title">
          <h1>{title}</h1>
          <p>ServiceWise complaint management workspace</p>
        </div>
      </div>

      <div className="crm-header-right" aria-label="Header actions">
        <button type="button" className="crm-header-icon-button" aria-label="Search">
          <FaSearch />
        </button>
        <button
          type="button"
          className="crm-header-icon-button"
          aria-label="Notifications"
        >
          <FaBell />
        </button>

        <div className="crm-header-user">
          <div className="crm-header-avatar">AR</div>
          <div>
            <strong>Abdul Rasheed</strong>
            <span>Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
}
