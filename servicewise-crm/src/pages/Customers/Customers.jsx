import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { useTickets } from "../../context/TicketContext";

import "./Customers.css";

function cleanValue(value) {
  return String(value ?? "").trim();
}

function normalizeClassName(value) {
  return cleanValue(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getCustomerName(ticket) {
  return (
    cleanValue(ticket?.customer?.name) ||
    cleanValue(ticket?.customer_name) ||
    cleanValue(ticket?.customerName) ||
    "Unknown Customer"
  );
}

function getCustomerEmail(ticket) {
  return (
    cleanValue(ticket?.customer?.email) ||
    cleanValue(ticket?.customer_email) ||
    cleanValue(ticket?.customerEmail)
  );
}

function getCustomerPhone(ticket) {
  return (
    cleanValue(ticket?.customer?.phone) ||
    cleanValue(ticket?.customer_phone) ||
    cleanValue(ticket?.customerPhone)
  );
}

function getTicketNumber(ticket) {
  return (
    cleanValue(ticket?.ticketNumber) ||
    cleanValue(ticket?.ticket_number) ||
    `Ticket #${ticket?.id || "N/A"}`
  );
}

function getCreatedAt(ticket) {
  return (
    ticket?.createdAt ||
    ticket?.created_at ||
    ticket?.received_at ||
    ""
  );
}

function getUpdatedAt(ticket) {
  return (
    ticket?.updatedAt ||
    ticket?.updated_at ||
    getCreatedAt(ticket)
  );
}

function getMessages(ticket) {
  return (
    ticket?.messages ||
    ticket?.conversations ||
    []
  );
}

function getInternalNotes(ticket) {
  return (
    ticket?.comments ||
    ticket?.internalNotes ||
    []
  );
}

function getActivities(ticket) {
  return ticket?.activities || [];
}

function getCustomerKey(ticket) {
  const email = getCustomerEmail(ticket).toLowerCase();

  if (email) {
    return `email:${email}`;
  }

  const phone = getCustomerPhone(ticket).replace(
    /\D/g,
    "",
  );

  if (phone) {
    return `phone:${phone}`;
  }

  return `name:${getCustomerName(ticket).toLowerCase()}`;
}

function toTimestamp(value) {
  if (!value) {
    return 0;
  }

  const parsedDate = new Date(value);

  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.getTime();
  }

  return 0;
}

function formatDate(value) {
  if (!value) {
    return "Time not recorded";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return cleanValue(value);
  }

  return parsedDate.toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isClosedTicket(ticket) {
  const status = cleanValue(
    ticket?.status,
  ).toLowerCase();

  return [
    "closed",
    "resolved",
    "irrelevant",
    "ignored",
    "not relevant",
    "not concerned",
  ].includes(status);
}

function isAgentMessage(message) {
  const sender = cleanValue(
    message?.sender ||
      message?.author ||
      message?.from,
  ).toLowerCase();

  return (
    sender.includes("agent") ||
    sender.includes("support") ||
    sender.includes("admin") ||
    sender.includes("servicewise")
  );
}

function getEventTypeLabel(type) {
  const labels = {
    ticket: "Ticket",
    activity: "Activity",
    message: "Message",
    email: "Email",
    note: "Internal Note",
    call: "Call",
    status: "Status",
    assigned: "Assignment",
    priority: "Priority",
    task: "Task",
    meeting: "Meeting",
  };

  return labels[type] || "Activity";
}

function buildTicketEvents(ticket) {
  if (!ticket) {
    return [];
  }

  const ticketId = String(ticket.id || "");
  const ticketNumber = getTicketNumber(ticket);
  const events = [];

  events.push({
    id: `created-${ticketId}`,
    type: "ticket",
    title: "Ticket created",
    detail:
      ticket.subject ||
      ticket.description ||
      "Customer complaint recorded.",
    date: getCreatedAt(ticket),
    timestamp: toTimestamp(getCreatedAt(ticket)),
    ticketId,
    ticketNumber,
    user: "System",
  });

  getActivities(ticket).forEach(
    (activity, index) => {
      const eventDate =
        activity.createdAt ||
        activity.created_at ||
        activity.time ||
        getUpdatedAt(ticket);

      const activityType =
        normalizeClassName(activity.type) ||
        "activity";

      events.push({
        id:
          activity.id ||
          `activity-${ticketId}-${index}`,
        type: activityType,
        title:
          activity.action ||
          activity.title ||
          "Ticket updated",
        detail:
          activity.details ||
          activity.notes ||
          activity.description ||
          "",
        date: eventDate,
        timestamp:
          toTimestamp(eventDate) ||
          toTimestamp(getUpdatedAt(ticket)),
        ticketId,
        ticketNumber,
        user:
          activity.user ||
          activity.author ||
          activity.performedByName ||
          "System",
      });
    },
  );

  getMessages(ticket).forEach(
    (message, index) => {
      const eventDate =
        message.createdAt ||
        message.created_at ||
        message.timestamp ||
        message.time ||
        getUpdatedAt(ticket);

      const channel = cleanValue(
        message.channel ||
          message.source ||
          "Conversation",
      );

      const sender =
        message.sender ||
        message.author ||
        message.from ||
        "Customer";

      events.push({
        id:
          message.id ||
          `message-${ticketId}-${index}`,
        type:
          channel.toLowerCase() === "email"
            ? "email"
            : "message",
        title: `${
          isAgentMessage(message)
            ? "Reply sent"
            : "Customer message received"
        }`,
        detail:
          message.message ||
          message.text ||
          message.body ||
          "",
        date: eventDate,
        timestamp:
          toTimestamp(eventDate) ||
          toTimestamp(getUpdatedAt(ticket)),
        ticketId,
        ticketNumber,
        user: sender,
        channel,
      });
    },
  );

  getInternalNotes(ticket).forEach(
    (note, index) => {
      const eventDate =
        note.createdAt ||
        note.created_at ||
        note.time ||
        getUpdatedAt(ticket);

      events.push({
        id:
          note.id ||
          `note-${ticketId}-${index}`,
        type: "note",
        title: "Internal note added",
        detail:
          note.note ||
          note.message ||
          note.text ||
          "Internal note",
        date: eventDate,
        timestamp:
          toTimestamp(eventDate) ||
          toTimestamp(getUpdatedAt(ticket)),
        ticketId,
        ticketNumber,
        user:
          note.author ||
          note.user ||
          "Support Team",
      });
    },
  );

  return events.sort(
    (firstEvent, secondEvent) =>
      secondEvent.timestamp -
      firstEvent.timestamp,
  );
}

function createCustomerRecords(tickets) {
  const customerMap = new Map();

  tickets.forEach((ticket) => {
    const key = getCustomerKey(ticket);
    const customerData = ticket.customer || {};

    if (!customerMap.has(key)) {
      customerMap.set(key, {
        key,
        id:
          customerData.id ||
          ticket.customer_id ||
          ticket.customerId ||
          key,
        name: getCustomerName(ticket),
        email: getCustomerEmail(ticket),
        phone: getCustomerPhone(ticket),
        customerId:
          customerData.customerId ||
          customerData.customer_id ||
          ticket.customer_id ||
          ticket.customerId ||
          "Not available",
        walletId:
          customerData.walletId ||
          customerData.wallet_id ||
          ticket.wallet_id ||
          ticket.walletId ||
          "Not available",
        retailerId:
          customerData.retailerId ||
          customerData.retailer_id ||
          ticket.retailer_id ||
          ticket.retailerId ||
          "Not available",
        cnic:
          customerData.cnic ||
          ticket.cnic ||
          ticket.customer_cnic ||
          "Not available",
        city:
          customerData.city ||
          ticket.city ||
          ticket.customer_city ||
          "Not available",
        accountStatus:
          customerData.accountStatus ||
          customerData.account_status ||
          ticket.account_status ||
          "Active",
        riskLevel:
          customerData.riskLevel ||
          customerData.risk_level ||
          ticket.risk_level ||
          "Normal",
        tickets: [],
      });
    }

    const customerRecord =
      customerMap.get(key);

    customerRecord.tickets.push(ticket);

    if (
      customerRecord.name ===
        "Unknown Customer" &&
      getCustomerName(ticket) !==
        "Unknown Customer"
    ) {
      customerRecord.name =
        getCustomerName(ticket);
    }

    if (!customerRecord.email) {
      customerRecord.email =
        getCustomerEmail(ticket);
    }

    if (!customerRecord.phone) {
      customerRecord.phone =
        getCustomerPhone(ticket);
    }
  });

  return Array.from(customerMap.values())
    .map((customer) => {
      const sortedTickets = [
        ...customer.tickets,
      ].sort(
        (firstTicket, secondTicket) =>
          toTimestamp(getCreatedAt(secondTicket)) -
          toTimestamp(getCreatedAt(firstTicket)),
      );

      const totalInteractions =
        sortedTickets.reduce(
          (total, ticket) =>
            total +
            getMessages(ticket).length +
            getActivities(ticket).length +
            getInternalNotes(ticket).length,
          0,
        );

      return {
        ...customer,
        tickets: sortedTickets,
        totalTickets: sortedTickets.length,
        openTickets: sortedTickets.filter(
          (ticket) => !isClosedTicket(ticket),
        ).length,
        closedTickets: sortedTickets.filter(
          isClosedTicket,
        ).length,
        totalInteractions,
        lastContact:
          getUpdatedAt(sortedTickets[0]) ||
          getCreatedAt(sortedTickets[0]) ||
          "",
      };
    })
    .sort(
      (firstCustomer, secondCustomer) =>
        toTimestamp(secondCustomer.lastContact) -
        toTimestamp(firstCustomer.lastContact),
    );
}

function CustomerAvatar({ name }) {
  const initials = cleanValue(name)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <div className="cw-avatar">
      {initials || "CU"}
    </div>
  );
}

function EmptySection({ title, description }) {
  return (
    <div className="cw-empty-state">
      <div className="cw-empty-icon">◎</div>

      <h3>{title}</h3>

      <p>{description}</p>
    </div>
  );
}

function JourneyTimeline({
  events,
  onOpenTicket,
}) {
  if (events.length === 0) {
    return (
      <EmptySection
        title="No journey events"
        description="Customer activity will appear here when tickets, messages, notes or status updates are recorded."
      />
    );
  }

  return (
    <div className="cw-timeline">
      {events.map((event) => (
        <article
          key={`${event.type}-${event.id}`}
          className="cw-timeline-item"
        >
          <div
            className={`cw-timeline-marker cw-event-${normalizeClassName(
              event.type,
            )}`}
          >
            <span />
          </div>

          <div className="cw-timeline-card">
            <div className="cw-timeline-top">
              <div>
                <span className="cw-event-label">
                  {getEventTypeLabel(
                    event.type,
                  )}
                </span>

                <h3>{event.title}</h3>
              </div>

              <time>
                {formatDate(event.date)}
              </time>
            </div>

            {event.detail && (
              <p className="cw-event-detail">
                {event.detail}
              </p>
            )}

            <div className="cw-event-footer">
              <span>
                By {event.user || "System"}
              </span>

              <button
                type="button"
                onClick={() =>
                  onOpenTicket(event.ticketId)
                }
              >
                {event.ticketNumber}
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function Customers() {
  const navigate = useNavigate();

  const {
    tickets = [],
    loading = false,
    error = "",
  } = useTickets();

  const [search, setSearch] =
    useState("");

  const [
    selectedCustomerKey,
    setSelectedCustomerKey,
  ] = useState("");

  const [selectedTicketId, setSelectedTicketId] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("customer-journey");

  const customers = useMemo(
    () => createCustomerRecords(tickets),
    [tickets],
  );

  const filteredCustomers = useMemo(() => {
    const searchTerm = search
      .trim()
      .toLowerCase();

    if (!searchTerm) {
      return customers;
    }

    return customers.filter((customer) => {
      return [
        customer.name,
        customer.email,
        customer.phone,
        customer.customerId,
        customer.walletId,
        customer.retailerId,
        customer.cnic,
      ].some((value) =>
        cleanValue(value)
          .toLowerCase()
          .includes(searchTerm),
      );
    });
  }, [customers, search]);

  useEffect(() => {
    if (filteredCustomers.length === 0) {
      setSelectedCustomerKey("");
      return;
    }

    const customerIsVisible =
      filteredCustomers.some(
        (customer) =>
          customer.key === selectedCustomerKey,
      );

    if (!customerIsVisible) {
      setSelectedCustomerKey(
        filteredCustomers[0].key,
      );
    }
  }, [
    filteredCustomers,
    selectedCustomerKey,
  ]);

  const selectedCustomer = useMemo(() => {
    return (
      customers.find(
        (customer) =>
          customer.key === selectedCustomerKey,
      ) ||
      filteredCustomers[0] ||
      null
    );
  }, [
    customers,
    filteredCustomers,
    selectedCustomerKey,
  ]);

  useEffect(() => {
    if (!selectedCustomer) {
      setSelectedTicketId("");
      return;
    }

    const selectedTicketStillExists =
      selectedCustomer.tickets.some(
        (ticket) =>
          String(ticket.id) ===
          String(selectedTicketId),
      );

    if (!selectedTicketStillExists) {
      setSelectedTicketId(
        String(
          selectedCustomer.tickets[0]?.id ||
            "",
        ),
      );
    }
  }, [
    selectedCustomer,
    selectedTicketId,
  ]);

  const selectedTicket = useMemo(() => {
    if (!selectedCustomer) {
      return null;
    }

    return (
      selectedCustomer.tickets.find(
        (ticket) =>
          String(ticket.id) ===
          String(selectedTicketId),
      ) ||
      selectedCustomer.tickets[0] ||
      null
    );
  }, [
    selectedCustomer,
    selectedTicketId,
  ]);

  const customerJourney = useMemo(() => {
    if (!selectedCustomer) {
      return [];
    }

    return selectedCustomer.tickets
      .flatMap(buildTicketEvents)
      .sort(
        (firstEvent, secondEvent) =>
          secondEvent.timestamp -
          firstEvent.timestamp,
      );
  }, [selectedCustomer]);

  const ticketJourney = useMemo(
    () => buildTicketEvents(selectedTicket),
    [selectedTicket],
  );

  const selectedMessages = useMemo(
    () => getMessages(selectedTicket),
    [selectedTicket],
  );

  const openTicket = (ticketId) => {
    navigate(`/tickets/${ticketId}`);
  };

  if (loading) {
    return (
      <div className="cw-page">
        <div className="cw-loading">
          <div className="cw-loading-spinner" />
          <h2>Loading customers</h2>
          <p>
            Building customer profiles from ticket
            information.
          </p>
        </div>
      </div>
    );
  }

  if (error && tickets.length === 0) {
    return (
      <div className="cw-page">
        <div className="cw-error-state">
          <h2>Unable to load customers</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cw-page">
      <header className="cw-page-header">
        <div>
          <span className="cw-page-eyebrow">
            Customer Management
          </span>

          <h1>Customer 360 Workspace</h1>

          <p>
            View every customer, complaint,
            interaction and ticket journey in one
            place.
          </p>
        </div>

        <div className="cw-header-summary">
          <span>Total Customers</span>
          <strong>{customers.length}</strong>
        </div>
      </header>

      <div className="cw-workspace">
        <aside className="cw-customer-panel">
          <div className="cw-customer-panel-header">
            <div>
              <h2>Customers</h2>
              <span>
                {filteredCustomers.length} records
              </span>
            </div>
          </div>

          <div className="cw-search-wrapper">
            <span>⌕</span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search name, phone, email, ID..."
            />
          </div>

          <div className="cw-customer-list">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(
                (customer) => (
                  <button
                    type="button"
                    key={customer.key}
                    className={`cw-customer-list-item ${
                      customer.key ===
                      selectedCustomer?.key
                        ? "active"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedCustomerKey(
                        customer.key,
                      );

                      setActiveTab(
                        "customer-journey",
                      );
                    }}
                  >
                    <CustomerAvatar
                      name={customer.name}
                    />

                    <div className="cw-customer-list-copy">
                      <strong>
                        {customer.name}
                      </strong>

                      <span>
                        {customer.email ||
                          customer.phone ||
                          "No contact information"}
                      </span>

                      <small>
                        {customer.totalTickets} ticket
                        {customer.totalTickets === 1
                          ? ""
                          : "s"}{" "}
                        · {customer.openTickets} active
                      </small>
                    </div>

                    <span className="cw-list-arrow">
                      ›
                    </span>
                  </button>
                ),
              )
            ) : (
              <EmptySection
                title="No customers found"
                description="Try another customer name, phone number, email address or ID."
              />
            )}
          </div>
        </aside>

        <main className="cw-customer-content">
          {selectedCustomer ? (
            <>
              <section className="cw-profile-card">
                <div className="cw-profile-heading">
                  <div className="cw-profile-identity">
                    <CustomerAvatar
                      name={selectedCustomer.name}
                    />

                    <div>
                      <span className="cw-profile-label">
                        Customer Profile
                      </span>

                      <h2>
                        {selectedCustomer.name}
                      </h2>

                      <div className="cw-profile-contact">
                        <span>
                          {selectedCustomer.email ||
                            "Email not available"}
                        </span>

                        <span>
                          {selectedCustomer.phone ||
                            "Phone not available"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="cw-profile-badges">
                    <span className="cw-account-badge">
                      {
                        selectedCustomer.accountStatus
                      }
                    </span>

                    <span className="cw-risk-badge">
                      Risk:{" "}
                      {selectedCustomer.riskLevel}
                    </span>
                  </div>
                </div>

                <div className="cw-profile-information">
                  <div>
                    <span>Customer ID</span>
                    <strong>
                      {selectedCustomer.customerId}
                    </strong>
                  </div>

                  <div>
                    <span>Wallet ID</span>
                    <strong>
                      {selectedCustomer.walletId}
                    </strong>
                  </div>

                  <div>
                    <span>Retailer ID</span>
                    <strong>
                      {selectedCustomer.retailerId}
                    </strong>
                  </div>

                  <div>
                    <span>CNIC</span>
                    <strong>
                      {selectedCustomer.cnic}
                    </strong>
                  </div>

                  <div>
                    <span>City</span>
                    <strong>
                      {selectedCustomer.city}
                    </strong>
                  </div>

                  <div>
                    <span>Last Contact</span>
                    <strong>
                      {formatDate(
                        selectedCustomer.lastContact,
                      )}
                    </strong>
                  </div>
                </div>
              </section>

              <section className="cw-stat-grid">
                <article className="cw-stat-card">
                  <span>Lifetime Tickets</span>
                  <strong>
                    {selectedCustomer.totalTickets}
                  </strong>
                  <small>
                    All customer complaints
                  </small>
                </article>

                <article className="cw-stat-card">
                  <span>Active Tickets</span>
                  <strong>
                    {selectedCustomer.openTickets}
                  </strong>
                  <small>
                    Requiring attention
                  </small>
                </article>

                <article className="cw-stat-card">
                  <span>Completed Tickets</span>
                  <strong>
                    {selectedCustomer.closedTickets}
                  </strong>
                  <small>
                    Resolved or closed
                  </small>
                </article>

                <article className="cw-stat-card">
                  <span>Total Interactions</span>
                  <strong>
                    {
                      selectedCustomer.totalInteractions
                    }
                  </strong>
                  <small>
                    Messages, notes and updates
                  </small>
                </article>
              </section>

              <section className="cw-detail-card">
                <div className="cw-tabs">
                  <button
                    type="button"
                    className={
                      activeTab ===
                      "customer-journey"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setActiveTab(
                        "customer-journey",
                      )
                    }
                  >
                    Customer Journey
                  </button>

                  <button
                    type="button"
                    className={
                      activeTab === "tickets"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setActiveTab("tickets")
                    }
                  >
                    Tickets
                    <span>
                      {
                        selectedCustomer.totalTickets
                      }
                    </span>
                  </button>

                  <button
                    type="button"
                    className={
                      activeTab ===
                      "ticket-journey"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setActiveTab(
                        "ticket-journey",
                      )
                    }
                  >
                    Ticket Journey
                  </button>

                  <button
                    type="button"
                    className={
                      activeTab === "email-thread"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setActiveTab(
                        "email-thread",
                      )
                    }
                  >
                    Email Thread
                  </button>
                </div>

                {(activeTab ===
                  "ticket-journey" ||
                  activeTab ===
                    "email-thread") && (
                  <div className="cw-ticket-selector">
                    <div>
                      <label htmlFor="customer-ticket">
                        Selected ticket
                      </label>

                      <select
                        id="customer-ticket"
                        value={selectedTicketId}
                        onChange={(event) =>
                          setSelectedTicketId(
                            event.target.value,
                          )
                        }
                      >
                        {selectedCustomer.tickets.map(
                          (ticket) => (
                            <option
                              key={ticket.id}
                              value={String(
                                ticket.id,
                              )}
                            >
                              {getTicketNumber(
                                ticket,
                              )}{" "}
                              —{" "}
                              {ticket.subject ||
                                "No subject"}
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    {selectedTicket && (
                      <button
                        type="button"
                        onClick={() =>
                          openTicket(
                            selectedTicket.id,
                          )
                        }
                      >
                        Open Full Ticket
                      </button>
                    )}
                  </div>
                )}

                <div className="cw-tab-content">
                  {activeTab ===
                    "customer-journey" && (
                    <div>
                      <div className="cw-section-heading">
                        <div>
                          <h2>
                            Complete Customer Journey
                          </h2>

                          <p>
                            All ticket creation,
                            communication, notes and
                            ticket updates across the
                            customer relationship.
                          </p>
                        </div>

                        <span>
                          {customerJourney.length}{" "}
                          events
                        </span>
                      </div>

                      <JourneyTimeline
                        events={customerJourney}
                        onOpenTicket={openTicket}
                      />
                    </div>
                  )}

                  {activeTab === "tickets" && (
                    <div>
                      <div className="cw-section-heading">
                        <div>
                          <h2>Customer Tickets</h2>

                          <p>
                            Every complaint connected
                            with this customer.
                          </p>
                        </div>
                      </div>

                      <div className="cw-table-wrapper">
                        <table className="cw-ticket-table">
                          <thead>
                            <tr>
                              <th>Ticket</th>
                              <th>Subject</th>
                              <th>Status</th>
                              <th>Priority</th>
                              <th>Category</th>
                              <th>Created</th>
                              <th />
                            </tr>
                          </thead>

                          <tbody>
                            {selectedCustomer.tickets.map(
                              (ticket) => (
                                <tr key={ticket.id}>
                                  <td>
                                    <button
                                      type="button"
                                      className="cw-ticket-link"
                                      onClick={() =>
                                        openTicket(
                                          ticket.id,
                                        )
                                      }
                                    >
                                      {getTicketNumber(
                                        ticket,
                                      )}
                                    </button>
                                  </td>

                                  <td>
                                    <strong>
                                      {ticket.subject ||
                                        "No subject"}
                                    </strong>
                                  </td>

                                  <td>
                                    <span
                                      className={`cw-badge cw-status-${normalizeClassName(
                                        ticket.status ||
                                          "Open",
                                      )}`}
                                    >
                                      {ticket.status ||
                                        "Open"}
                                    </span>
                                  </td>

                                  <td>
                                    <span
                                      className={`cw-badge cw-priority-${normalizeClassName(
                                        ticket.priority ||
                                          "Medium",
                                      )}`}
                                    >
                                      {ticket.priority ||
                                        "Medium"}
                                    </span>
                                  </td>

                                  <td>
                                    {ticket.category ||
                                      "General"}
                                  </td>

                                  <td>
                                    {formatDate(
                                      getCreatedAt(
                                        ticket,
                                      ),
                                    )}
                                  </td>

                                  <td>
                                    <button
                                      type="button"
                                      className="cw-row-action"
                                      onClick={() =>
                                        openTicket(
                                          ticket.id,
                                        )
                                      }
                                    >
                                      View
                                    </button>
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab ===
                    "ticket-journey" && (
                    <div>
                      <div className="cw-section-heading">
                        <div>
                          <h2>
                            Ticket Journey
                          </h2>

                          <p>
                            Complete lifecycle of{" "}
                            {selectedTicket
                              ? getTicketNumber(
                                  selectedTicket,
                                )
                              : "the selected ticket"}
                            .
                          </p>
                        </div>

                        <span>
                          {ticketJourney.length}{" "}
                          events
                        </span>
                      </div>

                      <JourneyTimeline
                        events={ticketJourney}
                        onOpenTicket={openTicket}
                      />
                    </div>
                  )}

                  {activeTab ===
                    "email-thread" && (
                    <div>
                      <div className="cw-section-heading">
                        <div>
                          <h2>
                            Email and Conversation
                            Thread
                          </h2>

                          <p>
                            Messages connected with{" "}
                            {selectedTicket
                              ? getTicketNumber(
                                  selectedTicket,
                                )
                              : "the selected ticket"}
                            .
                          </p>
                        </div>

                        <span>
                          {selectedMessages.length}{" "}
                          messages
                        </span>
                      </div>

                      {selectedTicket && (
                        <div className="cw-thread-subject">
                          <span>Subject</span>

                          <strong>
                            {selectedTicket.subject ||
                              "No subject"}
                          </strong>
                        </div>
                      )}

                      {selectedMessages.length > 0 ? (
                        <div className="cw-message-thread">
                          {selectedMessages.map(
                            (message, index) => {
                              const sender =
                                message.sender ||
                                message.author ||
                                message.from ||
                                "Customer";

                              const agentMessage =
                                isAgentMessage(
                                  message,
                                );

                              return (
                                <article
                                  key={
                                    message.id ||
                                    `thread-message-${index}`
                                  }
                                  className={`cw-thread-message ${
                                    agentMessage
                                      ? "agent"
                                      : "customer"
                                  }`}
                                >
                                  <div className="cw-thread-message-header">
                                    <div>
                                      <strong>
                                        {sender}
                                      </strong>

                                      <span
                                        className="cw-channel-label"
                                      >
                                        {message.channel ||
                                          message.source ||
                                          "Conversation"}
                                      </span>
                                    </div>

                                    <time>
                                      {formatDate(
                                        message.createdAt ||
                                          message.created_at ||
                                          message.timestamp ||
                                          message.time,
                                      )}
                                    </time>
                                  </div>

                                  <p>
                                    {message.message ||
                                      message.text ||
                                      message.body ||
                                      "No message content"}
                                  </p>
                                </article>
                              );
                            },
                          )}

                          <div className="cw-thread-actions">
                            <button
                              type="button"
                              onClick={() =>
                                openTicket(
                                  selectedTicket.id,
                                )
                              }
                            >
                              Open Ticket to Reply
                            </button>
                          </div>
                        </div>
                      ) : (
                        <EmptySection
                          title="No messages available"
                          description="The selected ticket does not currently contain an email or conversation thread."
                        />
                      )}
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <EmptySection
              title="No customer selected"
              description="Customer profiles are created automatically from the customer information stored inside tickets."
            />
          )}
        </main>
      </div>
    </div>
  );
}
