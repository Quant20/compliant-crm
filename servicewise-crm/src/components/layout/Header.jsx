import { FaBell, FaSearch, FaUserCircle } from "react-icons/fa";
import { useLocation } from "react-router-dom";

const titles = {
  "/dashboard": "Dashboard",
  "/tickets": "Tickets",
  "/customers": "Customers",
  "/agents": "Agents",
  "/knowledge-base": "Knowledge Base",
  "/reports": "Reports",
  "/settings": "Settings",
};

export default function Header() {
  const { pathname } = useLocation();
  const title = titles[pathname] || "ServiceWise CRM";

  return (
    <header className="header">
      <div>
        <h1 className="header-title">{title}</h1>
        <p className="header-subtitle">Welcome to ServiceWise CRM</p>
      </div>
      <div className="header-actions" aria-label="Header actions">
        <button type="button" className="icon-button" aria-label="Search">
          <FaSearch />
        </button>
        <button type="button" className="icon-button" aria-label="Notifications">
          <FaBell />
        </button>
        <button type="button" className="profile-button" aria-label="User profile">
          <FaUserCircle />
        </button>
      </div>
    </header>
  );
}
