import TicketInfoCard from "./TicketInfoCard";
import ConversationPanel from "./ConversationPanel";
import TicketActionsPanel from "./TicketActionsPanel";

function TicketDetailsDrawer({
  ticket,
  onClose,
  onUpdateTicket,
  onAddConversation,
  onAddInternalNote,
}) {
  if (!ticket) {
    return null;
  }

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        className="ticket-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Ticket ${ticket.ticketNumber}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="ticket-drawer__header">
          <div>
            <p className="eyebrow">{ticket.ticketNumber}</p>
            <h2>{ticket.subject}</h2>
          </div>
          <button className="drawer-close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="ticket-drawer__content">
          <TicketInfoCard ticket={ticket} />
          <TicketActionsPanel ticket={ticket} onUpdateTicket={onUpdateTicket} />
          <ConversationPanel
            ticket={ticket}
            onAddConversation={onAddConversation}
            onAddInternalNote={onAddInternalNote}
          />
        </div>
      </aside>
    </div>
  );
}

export default TicketDetailsDrawer;
