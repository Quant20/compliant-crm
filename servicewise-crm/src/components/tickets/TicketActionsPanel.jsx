import { useEffect, useState } from "react";

const statuses = ["Open", "In Progress", "Pending", "Resolved", "Closed"];
const priorities = ["Low", "Medium", "High", "Critical"];

function TicketActionsPanel({ ticket, onUpdateTicket }) {
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [assignedAgent, setAssignedAgent] = useState(ticket.assignedAgent || "");

  useEffect(() => {
    setStatus(ticket.status);
    setPriority(ticket.priority);
    setAssignedAgent(ticket.assignedAgent || "");
  }, [ticket]);

  const saveChanges = () => {
    onUpdateTicket(ticket.id, {
      status,
      priority,
      assignedAgent: assignedAgent.trim(),
    });
  };

  return (
    <section className="ticket-actions-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Management</p>
          <h3>Update ticket</h3>
        </div>
      </div>

      <div className="ticket-actions-grid">
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Priority</span>
          <select value={priority} onChange={(event) => setPriority(event.target.value)}>
            {priorities.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="ticket-actions-grid__agent">
          <span>Assigned agent</span>
          <input
            type="text"
            value={assignedAgent}
            onChange={(event) => setAssignedAgent(event.target.value)}
            placeholder="Agent name"
          />
        </label>
      </div>

      <button className="button button--primary" type="button" onClick={saveChanges}>
        Save changes
      </button>
    </section>
  );
}

export default TicketActionsPanel;
