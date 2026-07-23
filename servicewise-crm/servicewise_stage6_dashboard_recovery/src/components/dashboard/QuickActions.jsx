import {
  FaBookOpen,
  FaPlus,
  FaTicketAlt,
  FaWhatsapp,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function QuickActions({ onCreateTicket }) {
  const navigate = useNavigate();

  const actions = [
    {
      label: "Create a new ticket",
      description: "Register a customer complaint",
      icon: FaPlus,
      onClick: onCreateTicket,
    },
    {
      label: "Open ticket workspace",
      description: "Search and manage complaints",
      icon: FaTicketAlt,
      onClick: () => navigate("/tickets"),
    },
    {
      label: "WhatsApp Inbox",
      description: "Review customer conversations",
      icon: FaWhatsapp,
      onClick: () => navigate("/whatsapp-inbox"),
    },
    {
      label: "Help Center",
      description: "Find support guidance",
      icon: FaBookOpen,
      onClick: () => navigate("/help-center"),
    },
  ];

  return (
    <section className="sw-dashboard-panel sw-quick-actions-panel">
      <div className="sw-dashboard-panel-header">
        <div>
          <h3>Quick actions</h3>
          <p>Common support tasks</p>
        </div>
      </div>

      <div className="sw-quick-actions">
        {actions.map(({ label, description, icon: Icon, onClick }) => (
          <button
            type="button"
            key={label}
            className="sw-quick-action"
            onClick={onClick}
          >
            <span className="sw-quick-action-icon">
              <Icon />
            </span>

            <span>
              <strong>{label}</strong>
              <small>{description}</small>
            </span>

            <span className="sw-quick-action-arrow">›</span>
          </button>
        ))}
      </div>
    </section>
  );
}
