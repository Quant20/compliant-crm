function TicketToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  department,
  onDepartmentChange,
  onCreateTicket,
}) {
  return (
    <div className="ticket-toolbar">
      <div className="ticket-toolbar__search">
        <label htmlFor="ticket-search">Search tickets</label>
        <input
          id="ticket-search"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Ticket number, subject or customer"
        />
      </div>

      <div className="ticket-toolbar__filters">
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
            <option value="">All statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </label>

        <label>
          <span>Priority</span>
          <select value={priority} onChange={(event) => onPriorityChange(event.target.value)}>
            <option value="">All priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </label>

        <label>
          <span>Department</span>
          <select value={department} onChange={(event) => onDepartmentChange(event.target.value)}>
            <option value="">All departments</option>
            <option value="Customer Support">Customer Support</option>
            <option value="Operations">Operations</option>
            <option value="Finance">Finance</option>
            <option value="Retail">Retail</option>
            <option value="Technology">Technology</option>
            <option value="Compliance">Compliance</option>
          </select>
        </label>

        <button className="button button--primary toolbar-create" type="button" onClick={onCreateTicket}>
          Create ticket
        </button>
      </div>
    </div>
  );
}

export default TicketToolbar;
