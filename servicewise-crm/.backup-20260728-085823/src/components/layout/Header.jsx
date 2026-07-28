import {
  FaBars,
  FaBell,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaKey,
  FaSearch,
  FaSignOutAlt,
} from "react-icons/fa";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const titles = {
  "/dashboard": "Dashboard",
  "/tickets": "Tickets",
  "/whatsapp-inbox": "WhatsApp Inbox",
  "/customers": "Customers",
  "/agents": "Agents",
  "/help-center": "Help Center",
  "/knowledge-base": "Help Center",
  "/reports": "Reports",
  "/settings": "Settings",
  "/user-management": "User Management",
};

function getPageTitle(pathname) {
  if (pathname.startsWith("/tickets/")) {
    return "Ticket Details";
  }

  return titles[pathname] || "ServiceWise CRM";
}

function getInitials(user) {
  const source = user?.name || user?.email || "SW";
  const words = String(source)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export default function Header({
  sidebarCollapsed,
  onToggleSidebar,
  onOpenMobileSidebar,
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const {
    currentUser,
    logout,
    loading,
  } = useAuth();

  const title = getPageTitle(pathname);
  const initials = useMemo(
    () => getInitials(currentUser),
    [currentUser],
  );

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="crm-header">
      <div className="crm-header-left">
        <button
          type="button"
          className="crm-sidebar-toggle crm-desktop-sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label={
            sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
          }
        >
          {sidebarCollapsed ? (
            <FaChevronRight />
          ) : (
            <FaChevronLeft />
          )}
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
        <button
          type="button"
          className="crm-header-icon-button"
          aria-label="Search"
        >
          <FaSearch />
        </button>

        <button
          type="button"
          className="crm-header-icon-button"
          aria-label="Notifications"
        >
          <FaBell />
        </button>

        <div className="crm-profile-menu" ref={menuRef}>
          <button
            type="button"
            className="crm-header-user-button"
            onClick={() =>
              setProfileOpen((current) => !current)
            }
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            <div className="crm-header-avatar">{initials}</div>

            <div className="crm-header-user-copy">
              <strong>
                {currentUser?.name ||
                  currentUser?.email ||
                  "ServiceWise User"}
              </strong>
              <span>{currentUser?.role || "User"}</span>
            </div>

            <FaChevronDown className="crm-profile-chevron" />
          </button>

          {profileOpen && (
            <div className="crm-profile-dropdown" role="menu">
              <div className="crm-profile-dropdown-user">
                <strong>
                  {currentUser?.name || "ServiceWise User"}
                </strong>
                <span>{currentUser?.email || ""}</span>
                <small>
                  {currentUser?.role || "User"}
                  {currentUser?.department
                    ? ` · ${currentUser.department}`
                    : ""}
                </small>
              </div>

              <button
                type="button"
                className="crm-profile-menu-item"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/settings");
                }}
                role="menuitem"
              >
                <FaKey />
                <span>Change password</span>
              </button>

              <button
                type="button"
                className="crm-profile-logout"
                onClick={handleLogout}
                disabled={loading}
                role="menuitem"
              >
                <FaSignOutAlt />
                <span>
                  {loading ? "Signing out…" : "Sign out"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
