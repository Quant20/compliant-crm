import { useNavigate } from "react-router-dom";

import { formatDashboardDate } from "../../data/dashboardData";

function getCustomer(ticket) {
  return (
    ticket?.customer?.name ||
    ticket?.customerName ||
    ticket?.customer_name ||
    "Unknown customer"
  );
}

function getNumber(ticket) {
  return (
    ticket?.ticketNumber ||
    ticket?.ticket_number ||
    `#${ticket?.id}`
  );
}

function slug(value) {
  return String(value || "unknown")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export default function RecentTickets({ tickets }) {
  const navigate = useNavigate();

  return (
    <section className="sw-dashboard-panel">
      <div className="sw-dashboard-panel-header">
        <div>
          <h3>Recent tickets</h3>
          <p>Latest complaint updates</p>
        </div>

        <button
          type="button"
          className="sw-dashboard-panel-link"
          onClick={() => navigate("/tickets")}
        >
          View all
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="sw-dashboard-empty">
          No tickets are available yet.
        </div>
      ) : (
        <div className="sw-recent-ticket-scroll">
          <table className="sw-recent-ticket-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Customer</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>

            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() =>
                    navigate(`/tickets/${ticket.id}`)
                  }
                >
                  <td>
                    <strong>{getNumber(ticket)}</strong>
                    <span>{ticket.subject || "No subject"}</span>
                  </td>
                  <td>{getCustomer(ticket)}</td>
                  <td>
                    <span
                      className={`sw-ticket-pill sw-ticket-pill--priority-${slug(
                        ticket.priority,
                      )}`}
                    >
                      {ticket.priority || "Medium"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`sw-ticket-pill sw-ticket-pill--status-${slug(
                        ticket.status,
                      )}`}
                    >
                      {ticket.status || "Open"}
                    </span>
                  </td>
                  <td>
                    {formatDashboardDate(
                      ticket.updatedAt ||
                      ticket.updated_at ||
                      ticket.createdAt ||
                      ticket.created_at,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
