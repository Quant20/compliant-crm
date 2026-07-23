import Badge from "../common/Badge";

function TicketInfoCard({ ticket }) {
  const fields = [
    ["Customer", ticket.customerName],
    ["Email", ticket.customerEmail || "Not provided"],
    ["Phone", ticket.customerPhone || "Not provided"],
    ["Department", ticket.department],
    ["Assigned agent", ticket.assignedAgent || "Unassigned"],
    ["Category", ticket.category || "General"],
    ["Channel", ticket.channel || "Manual"],
    ["Created", new Date(ticket.createdAt).toLocaleString()],
  ];

  return (
    <section className="ticket-info-card">
      <div className="ticket-info-card__badges">
        <Badge value={ticket.priority} />
        <Badge value={ticket.status} />
      </div>

      <p className="ticket-description">{ticket.description}</p>

      <dl className="ticket-info-grid">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default TicketInfoCard;
