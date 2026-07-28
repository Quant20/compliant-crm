import React, { useState } from "react";

import { useTickets } from "../../context/TicketContext";

import TicketRow from "./TicketRow";

const hasValidTicketId = (ticket) => {
  return (
    ticket?.id !== undefined &&
    ticket?.id !== null &&
    ticket?.id !== ""
  );
};

export default function TicketTable({
  tickets = [],
  startIndex = 0,
  onView,
}) {
  const ticketContext = useTickets();

  const updateTicket =
    ticketContext?.updateTicket;

  const deleteTicket =
    ticketContext?.deleteTicket;

  const [workingTicketId, setWorkingTicketId] =
    useState(null);

  const changeTicketStatus = async ({
    ticket,
    nextStatus,
    confirmationMessage,
  }) => {
    if (!hasValidTicketId(ticket)) {
      window.alert(
        "Unable to update this ticket because its ID is missing.",
      );

      return;
    }

    if (typeof updateTicket !== "function") {
      window.alert(
        "The updateTicket function is not available in TicketContext.",
      );

      return;
    }

    const confirmed = window.confirm(
      confirmationMessage,
    );

    if (!confirmed) {
      return;
    }

    try {
      setWorkingTicketId(ticket.id);

      await updateTicket(ticket.id, {
        status: nextStatus,
      });
    } catch (error) {
      console.error(
        `Unable to change ticket status to ${nextStatus}:`,
        error,
      );

      window.alert(
        error?.message ||
          "The ticket status could not be updated.",
      );
    } finally {
      setWorkingTicketId(null);
    }
  };

  const closeTicket = async (ticket) => {
    await changeTicketStatus({
      ticket,
      nextStatus: "Closed",
      confirmationMessage:
        "Close this ticket?\n\nIt will move to the Closed Tickets tab.",
    });
  };

  const markTicketIrrelevant = async (
    ticket,
  ) => {
    await changeTicketStatus({
      ticket,
      nextStatus: "Irrelevant",
      confirmationMessage:
        "Mark this ticket as irrelevant?\n\nUse this when the complaint does not concern Customer Support. It will move to the Irrelevant Tickets tab.",
    });
  };

  const reopenTicket = async (ticket) => {
    await changeTicketStatus({
      ticket,
      nextStatus: "Open",
      confirmationMessage:
        "Reopen this ticket?\n\nIt will move back to the main Tickets tab.",
    });
  };

  const removeTicket = async (ticket) => {
    if (!hasValidTicketId(ticket)) {
      window.alert(
        "Unable to delete this ticket because its ID is missing.",
      );

      return;
    }

    if (typeof deleteTicket !== "function") {
      window.alert(
        "The deleteTicket function is not available in TicketContext.",
      );

      return;
    }

    const ticketNumber =
      ticket.ticketNumber ||
      ticket.ticket_number ||
      ticket.id;

    const confirmed = window.confirm(
      `Delete ticket ${ticketNumber}?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setWorkingTicketId(ticket.id);

      await deleteTicket(ticket.id);
    } catch (error) {
      console.error(
        "Unable to delete ticket:",
        error,
      );

      window.alert(
        error?.message ||
          "The ticket could not be deleted.",
      );
    } finally {
      setWorkingTicketId(null);
    }
  };

  if (
    !Array.isArray(tickets) ||
    tickets.length === 0
  ) {
    return (
      <div className="crm-ticket-empty">
        <h3>No tickets found</h3>

        <p>
          No tickets match the current view or
          filters.
        </p>
      </div>
    );
  }

  return (
    <div className="crm-ticket-table-container">
      <table className="crm-ticket-table">
        <thead>
          <tr>
            <th className="crm-col-index">#</th>

            <th className="crm-col-ticket-number">
              Ticket no.
            </th>

            <th className="crm-col-subject">
              Issue
            </th>

            <th className="crm-col-customer">
              Customer
            </th>

            <th className="crm-col-category">
              Category
            </th>

            <th className="crm-col-status">
              Status
            </th>

            <th className="crm-col-priority">
              Priority
            </th>

            <th className="crm-col-owner">
              Assigned Agent
            </th>

            <th className="crm-col-created">
              Created
            </th>

            <th className="crm-col-actions">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {tickets.map((ticket, index) => (
            <TicketRow
              key={
                ticket.id ||
                ticket.ticketNumber ||
                ticket.ticket_number ||
                `${startIndex}-${index}`
              }
              ticket={ticket}
              rowNumber={
                startIndex + index + 1
              }
              onView={onView}
              onClose={closeTicket}
              onMarkIrrelevant={
                markTicketIrrelevant
              }
              onReopen={reopenTicket}
              onDelete={removeTicket}
              isWorking={
                String(workingTicketId) ===
                String(ticket.id)
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
