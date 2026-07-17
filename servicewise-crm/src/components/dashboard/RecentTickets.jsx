import Card from "../ui/Card";
import { recentTickets } from "../../data/dashboardData";

export default function RecentTickets() {
  return (
    <Card title="Recent Tickets">
      <table className="recent-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Subject</th>
            <th>Customer</th>
            <th>Priority</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {recentTickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>{ticket.id}</td>
              <td>{ticket.subject}</td>
              <td>{ticket.customer}</td>
              <td>{ticket.priority}</td>
              <td>{ticket.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}