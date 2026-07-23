import { useMemo } from "react";
import { useTickets } from "../../context/TicketContext";
import "./Reports.css";

function normalize(value) {
  return String(value || "Unknown").trim();
}

function groupTickets(tickets, selector) {
  return tickets.reduce((result, ticket) => {
    const key = normalize(selector(ticket));
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
}

function Distribution({ title, data, total }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return (
    <div className="reports-panel">
      <h3>{title}</h3>
      <div className="report-bars">
        {entries.length === 0 && <p className="reports-empty">No ticket data available.</p>}
        {entries.map(([label, value]) => {
          const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <div className="report-bar-row" key={label}>
              <div className="report-bar-row__label"><span>{label}</span><strong>{value} ({percentage}%)</strong></div>
              <div className="report-bar"><span style={{ width: `${percentage}%` }} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Reports() {
  const { tickets = [], dataSource = "local" } = useTickets();

  const report = useMemo(() => {
    const closed = tickets.filter((ticket) => ["closed", "resolved"].includes(String(ticket.status || "").toLowerCase())).length;
    const open = tickets.length - closed;
    const critical = tickets.filter((ticket) => String(ticket.priority || "").toLowerCase() === "critical").length;
    const assigned = tickets.filter((ticket) => {
      const owner = ticket.assignedAgent || ticket.assignedAgentName || ticket.assigned_agent_name;
      return owner && String(owner).toLowerCase() !== "unassigned";
    }).length;

    return {
      total: tickets.length,
      open,
      closed,
      critical,
      assignmentRate: tickets.length ? Math.round((assigned / tickets.length) * 100) : 0,
      status: groupTickets(tickets, (ticket) => ticket.status || "Unknown"),
      priority: groupTickets(tickets, (ticket) => ticket.priority || "Unknown"),
      department: groupTickets(tickets, (ticket) => ticket.department || ticket.team || "Unassigned"),
    };
  }, [tickets]);

  return (
    <section className="crm-page-container reports-page">
      <div className="reports-page__header">
        <div>
          <p className="page-eyebrow">PERFORMANCE OVERVIEW</p>
          <h2>Reports</h2>
          <p>Live operational summary from the currently loaded {dataSource} ticket dataset.</p>
        </div>
      </div>

      <div className="reports-summary">
        <article><span>Total tickets</span><strong>{report.total}</strong></article>
        <article><span>Active tickets</span><strong>{report.open}</strong></article>
        <article><span>Resolved or closed</span><strong>{report.closed}</strong></article>
        <article><span>Assignment rate</span><strong>{report.assignmentRate}%</strong></article>
      </div>

      <div className="reports-grid">
        <Distribution title="Tickets by status" data={report.status} total={report.total} />
        <Distribution title="Tickets by priority" data={report.priority} total={report.total} />
        <Distribution title="Tickets by department" data={report.department} total={report.total} />
        <div className="reports-panel reports-attention-panel">
          <h3>Attention required</h3>
          <strong>{report.critical}</strong>
          <p>Critical-priority ticket(s) currently need monitoring.</p>
        </div>
      </div>
    </section>
  );
}
