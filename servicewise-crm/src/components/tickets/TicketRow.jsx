import React, {
  useEffect,
  useState,
} from "react";

import {
  FaBan,
  FaCheck,
  FaTrashAlt,
  FaUndoAlt,
} from "react-icons/fa";

import {
  formatSlaDeadline,
  getSlaStatus,
} from "../../services/slaService";

const normalizeClassValue = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const getOriginalTicketNumber = (ticket) => {
  return (
    ticket.ticketNumber ||
    ticket.ticket_number ||
    ticket.id ||
    ""
  );
};

const getDisplayTicketNumber = (
  ticket,
  rowNumber,
) => {
  const originalNumber =
    getOriginalTicketNumber(ticket);

  const digits = String(
    originalNumber,
  ).replace(/\D/g, "");

  if (digits) {
    return `TKT-${digits
      .slice(-6)
      .padStart(6, "0")}`;
  }

  return `TKT-${String(rowNumber).padStart(
    3,
    "0",
  )}`;
};

const getCustomerName = (ticket) => {
  return (
    ticket.customer?.name ||
    ticket.customer_name ||
    ticket.customerName ||
    "Unknown customer"
  );
};

const getCustomerEmail = (ticket) => {
  return (
    ticket.customer?.email ||
    ticket.customer_email ||
    ticket.customerEmail ||
    ""
  );
};

const getCategory = (ticket) => {
  return (
    ticket.category ||
    ticket.issueType ||
    ticket.issue_type ||
    ticket.department ||
    ticket.team ||
    "General"
  );
};

const getOwner = (ticket) => {
  return (
    ticket.assignedAgent ||
    ticket.assignedAgentName ||
    ticket.assigned_agent_name ||
    ticket.owner?.name ||
    ticket.owner_name ||
    "Unassigned"
  );
};

const getCreatedValue = (ticket) => {
  return (
    ticket.createdAt ||
    ticket.created_at ||
    ticket.received_at ||
    ticket.dateCreated ||
    ""
  );
};

const formatCreatedDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatFullCreatedDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const isIrrelevantStatus = (statusClass) => {
  return [
    "irrelevant",
    "not-concerned",
    "not-relevant",
    "ignored",
  ].includes(statusClass);
};

export default function TicketRow({
  ticket,
  rowNumber,
  onView,
  onClose,
  onMarkIrrelevant,
  onReopen,
  onDelete,
  isWorking = false,
}) {
  const originalTicketNumber =
    getOriginalTicketNumber(ticket);

  const displayTicketNumber =
    getDisplayTicketNumber(
      ticket,
      rowNumber,
    );

  const customerName =
    getCustomerName(ticket);

  const customerEmail =
    getCustomerEmail(ticket);

  const category = getCategory(ticket);
  const owner = getOwner(ticket);

  const status = ticket.status || "Open";
  const priority =
    ticket.priority || "Medium";

  const createdValue =
    getCreatedValue(ticket);

  const statusClass =
    normalizeClassValue(status);

  const priorityClass =
    normalizeClassValue(priority);

  const isClosed =
    statusClass === "closed";

  const isIrrelevant =
    isIrrelevantStatus(statusClass);

  const isArchived =
    isClosed || isIrrelevant;

  const [currentTime, setCurrentTime] =
    useState(Date.now());

  useEffect(() => {
    if (isArchived) {
      return undefined;
    }

    const intervalId =
      window.setInterval(() => {
        setCurrentTime(Date.now());
      }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isArchived]);

  const slaStatus = getSlaStatus(
    ticket,
    currentTime,
  );

  const slaTitle = slaStatus.dueTimestamp
    ? `Deadline: ${formatSlaDeadline(
        slaStatus.dueTimestamp,
      )}`
    : "SLA deadline not available";

  const openTicket = () => {
    if (
      !isWorking &&
      typeof onView === "function"
    ) {
      onView(ticket);
    }
  };

  return (
    <tr className="crm-ticket-row">
      <td className="crm-col-index">
        {rowNumber}
      </td>

      <td className="crm-col-ticket-number">
        <button
          type="button"
          className="crm-ticket-number-link"
          title={
            originalTicketNumber ||
            displayTicketNumber
          }
          disabled={isWorking}
          onClick={openTicket}
        >
          {displayTicketNumber}
        </button>
      </td>

      <td className="crm-col-subject">
        <span
          className="crm-ticket-subject"
          title={
            ticket.subject || "No subject"
          }
        >
          {ticket.subject || "No subject"}
        </span>
      </td>

      <td className="crm-col-customer">
        <div className="crm-customer-cell">
          <span
            className="crm-customer-name"
            title={customerName}
          >
            {customerName}
          </span>

          {customerEmail && (
            <span
              className="crm-customer-email"
              title={customerEmail}
            >
              {customerEmail}
            </span>
          )}
        </div>
      </td>

      <td className="crm-col-category">
        <span
          className="crm-table-plain-text"
          title={category}
        >
          {category}
        </span>
      </td>

      <td className="crm-col-status">
        <span
          className={`crm-status-text crm-status-text-${statusClass}`}
        >
          {status}
        </span>
      </td>

      <td className="crm-col-priority">
        <span
          className={`crm-priority-text crm-priority-text-${priorityClass}`}
        >
          {priority}
        </span>
      </td>

      <td className="crm-col-owner">
        <span
          className="crm-table-plain-text"
          title={owner}
        >
          {owner}
        </span>
      </td>

      <td
        className="crm-col-created"
        title={formatFullCreatedDate(
          createdValue,
        )}
      >
        <span className="crm-created-text">
          {formatCreatedDate(
            createdValue,
          )}
        </span>
      </td>

      <td className="crm-col-actions">
        <div className="crm-ticket-actions">
          {isArchived ? (
            <button
              type="button"
              className="crm-list-action-button crm-list-reopen-button"
              title="Reopen ticket"
              aria-label="Reopen ticket"
              disabled={isWorking}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                if (
                  typeof onReopen ===
                  "function"
                ) {
                  onReopen(ticket);
                }
              }}
            >
              <FaUndoAlt />
            </button>
          ) : (
            <>
              <button
                type="button"
                className="crm-list-action-button crm-list-irrelevant-button"
                title="Mark as irrelevant"
                aria-label="Mark ticket as irrelevant"
                disabled={isWorking}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  if (
                    typeof onMarkIrrelevant ===
                    "function"
                  ) {
                    onMarkIrrelevant(ticket);
                  }
                }}
              >
                <FaBan />
              </button>

              <button
                type="button"
                className="crm-list-action-button crm-list-close-button"
                title="Close ticket"
                aria-label="Close ticket"
                disabled={isWorking}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  if (
                    typeof onClose ===
                    "function"
                  ) {
                    onClose(ticket);
                  }
                }}
              >
                <FaCheck />
              </button>
            </>
          )}

          <button
            type="button"
            className="crm-list-action-button crm-list-delete-button"
            title="Delete ticket"
            aria-label="Delete ticket"
            disabled={isWorking}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();

              if (
                typeof onDelete === "function"
              ) {
                onDelete(ticket);
              }
            }}
          >
            <FaTrashAlt />
          </button>
        </div>
      </td>
    </tr>
  );
}
