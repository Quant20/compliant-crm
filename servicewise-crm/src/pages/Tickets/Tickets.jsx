import { useTickets } from "../../context/TicketContext";

export default function Tickets() {
  const { tickets } = useTickets();

  return (
    <div>
      <h1>Tickets</h1>

      <table className="recent-table">
        <thead>
          <tr>
            <th>Ticket #</th>
            <th>Subject</th>
            <th>Customer</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assigned Agent</th>
          </tr>
        </thead>

        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>{ticket.ticketNumber}</td>
              <td>{ticket.subject}</td>
              <td>{ticket.customer.name}</td>
              <td>{ticket.priority}</td>
              <td>{ticket.status}</td>
              <td>{ticket.assignedAgent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}