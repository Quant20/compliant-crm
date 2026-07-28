import "./Tickets.css";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { useTickets } from "../../context/TicketContext";

import {
  getSlaStatus,
} from "../../services/slaService";

import { getAgents } from "../../services/agentService";

import TicketTable from "../../components/tickets/TicketTable";
import CreateTicketModal from "../../components/tickets/CreateTicketModal";
import CustomSelect from "../../components/ui/CustomSelect";

const PAGE_SIZE_OPTIONS = [50, 100, 200, 500];

const PRIORITY_ORDER = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

const getTicketNumber = (ticket) => {
  return (
    ticket.ticketNumber ||
    ticket.ticket_number ||
    `SW-${ticket.id}`
  );
};

const getCustomerName = (ticket) => {
  return (
    ticket.customer?.name ||
    ticket.customer_name ||
    ticket.customerName ||
    ""
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

const getAssignedAgent = (ticket) => {
  const assignedAgent =
    ticket.assignedAgent ||
    ticket.assignedAgentName ||
    ticket.assigned_agent_name ||
    ticket.assigned_agent ||
    "Unassigned";

  return normalizeText(assignedAgent) ===
    "usman ali"
    ? "Unassigned"
    : assignedAgent;
};

const getDepartment = (ticket) => {
  return (
    ticket.department ||
    ticket.team ||
    "Unassigned"
  );
};

const getCreatedTimestamp = (ticket) => {
  const dateValue =
    ticket.createdAt ||
    ticket.created_at ||
    ticket.received_at ||
    "";

  const timestamp = new Date(dateValue).getTime();

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
};

const CLOSED_STATUSES = new Set([
  "closed",
]);

const IRRELEVANT_STATUSES = new Set([
  "irrelevant",
  "ignored",
  "not concerned",
  "not-concerned",
  "not relevant",
  "not-relevant",
]);

const TICKET_VIEW_OPTIONS = [
  {
    key: "active",
    label: "Active",
  },
  {
    key: "closed",
    label: "Closed",
  },
  {
    key: "sla-escalated",
    label: "SLA Escalated",
  },
  {
    key: "irrelevant",
    label: "Irrelevant",
  },
  {
    key: "all",
    label: "All",
  },
];

const getTicketView = (ticket) => {
  const status = normalizeText(ticket.status);

  if (CLOSED_STATUSES.has(status)) {
    return "closed";
  }

  if (IRRELEVANT_STATUSES.has(status)) {
    return "irrelevant";
  }

  return "active";
};

export default function Tickets() {
  const navigate = useNavigate();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const requestedCustomerId =
    searchParams.get("customerId") || "";

  const createTicketRequested =
    searchParams.get("create") === "1";

  const {
    tickets = [],
    loading = false,
    error = "",
    loadTickets,
    clearTicketError,
  } = useTickets();

  const [searchTerm, setSearchTerm] =
    useState("");

  const [ticketView, setTicketView] =
    useState("active");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [priorityFilter, setPriorityFilter] =
    useState("All");

  const [slaFilter, setSlaFilter] =
    useState("All");

  const [
    departmentFilter,
    setDepartmentFilter,
  ] = useState("All");

  const [ownerFilter, setOwnerFilter] =
    useState("All");

  const [sortBy, setSortBy] =
    useState("newest");

  const [currentPage, setCurrentPage] =
    useState(1);

  const [
    ticketsPerPage,
    setTicketsPerPage,
  ] = useState(50);

  const [
    showCreateTicket,
    setShowCreateTicket,
  ] = useState(false);

  useEffect(() => {
    if (createTicketRequested) {
      setShowCreateTicket(true);
    }
  }, [createTicketRequested]);

  const closeCreateTicketModal = () => {
    setShowCreateTicket(false);

    if (
      createTicketRequested ||
      requestedCustomerId
    ) {
      const nextParams =
        new URLSearchParams(
          searchParams,
        );

      nextParams.delete("create");
      nextParams.delete(
        "customerId",
      );

      setSearchParams(
        nextParams,
        {
          replace: true,
        },
      );
    }
  };

  const [refreshing, setRefreshing] =
    useState(false);

  const ticketViewCounts = useMemo(() => {
    const counts = {
      active: 0,
      closed: 0,
      "sla-escalated": 0,
      irrelevant: 0,
      all: tickets.length,
    };

    tickets.forEach((ticket) => {
      const view = getTicketView(ticket);

      counts[view] += 1;

      if (
        view === "active" &&
        getSlaStatus(ticket).state ===
          "breached"
      ) {
        counts["sla-escalated"] += 1;
      }
    });

    return counts;
  }, [tickets]);

  const ticketsForSelectedView = useMemo(() => {
    if (ticketView === "all") {
      return tickets;
    }

    if (ticketView === "sla-escalated") {
      return tickets.filter((ticket) => {
        return (
          getTicketView(ticket) === "active" &&
          getSlaStatus(ticket).state ===
            "breached"
        );
      });
    }

    return tickets.filter((ticket) => {
      return getTicketView(ticket) === ticketView;
    });
  }, [tickets, ticketView]);

  const statusOptions = useMemo(() => {
    const standardStatuses = [
      "Open",
      "In Progress",
      "Pending",
      "Resolved",
      "Closed",
      "Irrelevant",
    ];

    const ticketStatuses = tickets
      .map((ticket) => ticket.status)
      .filter(Boolean);

    const seenStatuses = new Set();

    const values = [
      ...standardStatuses,
      ...ticketStatuses,
    ].filter((status) => {
      const key = normalizeText(status);

      if (!key || seenStatuses.has(key)) {
        return false;
      }

      seenStatuses.add(key);
      return true;
    });

    return ["All", ...values];
  }, [tickets]);

  const priorityOptions = useMemo(() => {
    const standardPriorities = [
      "Critical",
      "High",
      "Medium",
      "Low",
    ];

    const ticketPriorities = tickets
      .map((ticket) => ticket.priority)
      .filter(Boolean);

    const seenPriorities = new Set();

    const values = [
      ...standardPriorities,
      ...ticketPriorities,
    ].filter((priority) => {
      const key = normalizeText(priority);

      if (!key || seenPriorities.has(key)) {
        return false;
      }

      seenPriorities.add(key);
      return true;
    });

    values.sort(
      (firstPriority, secondPriority) => {
        const priorityDifference =
          (PRIORITY_ORDER[secondPriority] || 0) -
          (PRIORITY_ORDER[firstPriority] || 0);

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return firstPriority.localeCompare(
          secondPriority,
        );
      },
    );

    return ["All", ...values];
  }, [tickets]);

  const departmentOptions = useMemo(() => {
    const values = tickets
      .map(getDepartment)
      .filter(Boolean);

    const uniqueDepartments =
      Array.from(new Set(values)).sort(
        (firstDepartment, secondDepartment) =>
          firstDepartment.localeCompare(
            secondDepartment,
          ),
      );

    return ["All", ...uniqueDepartments];
  }, [tickets]);

  const ownerOptions = useMemo(() => {
    const optionMap = new Map();

    optionMap.set("unassigned", {
      value: "Unassigned",
      label: "Unassigned",
    });

    let savedAgents = [];

    try {
      savedAgents = getAgents();
    } catch (error) {
      console.error(
        "Unable to load saved agents:",
        error,
      );
    }

    savedAgents.forEach((agent) => {
      const agentName = String(
        agent.name ||
          [
            agent.firstName,
            agent.lastName,
          ]
            .filter(Boolean)
            .join(" "),
      ).trim();

      if (!agentName) {
        return;
      }

      const employeeId =
        agent.employeeId ||
        agent.employee_id ||
        "";

      const accountStatus =
        agent.accountStatus ||
        agent.account_status ||
        "Active";

      const details = [
        employeeId,
        accountStatus !== "Active"
          ? accountStatus
          : "",
      ].filter(Boolean);

      optionMap.set(
        normalizeText(agentName),
        {
          value: agentName,
          label: details.length
            ? `${agentName} — ${details.join(" · ")}`
            : agentName,
        },
      );
    });

    tickets
      .map(getAssignedAgent)
      .filter(
        (agentName) =>
          Boolean(agentName) &&
          normalizeText(agentName) !==
            "usman ali",
      )
      .forEach((agentName) => {
        const key = normalizeText(agentName);

        if (!optionMap.has(key)) {
          optionMap.set(key, {
            value: agentName,
            label: agentName,
          });
        }
      });

    const options =
      Array.from(optionMap.values()).sort(
        (firstAgent, secondAgent) => {
          if (
            firstAgent.value === "Unassigned"
          ) {
            return -1;
          }

          if (
            secondAgent.value === "Unassigned"
          ) {
            return 1;
          }

          return firstAgent.label.localeCompare(
            secondAgent.label,
          );
        },
      );

    return [
      {
        value: "All",
        label: "All agents",
      },
      ...options,
    ];
  }, [tickets]);

  const ticketStatistics = useMemo(() => {
    const total = tickets.length;

    const open = tickets.filter((ticket) => {
      return (
        normalizeText(ticket.status) === "open"
      );
    }).length;

    const inProgress = tickets.filter(
      (ticket) => {
        return (
          normalizeText(ticket.status) ===
          "in progress"
        );
      },
    ).length;

    const pending = tickets.filter((ticket) => {
      return (
        normalizeText(ticket.status) ===
        "pending"
      );
    }).length;

    const resolved = tickets.filter(
      (ticket) => {
        const status = normalizeText(
          ticket.status,
        );

        return (
          status === "resolved" ||
          status === "closed"
        );
      },
    ).length;

    return {
      total,
      open,
      inProgress,
      pending,
      resolved,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const normalizedSearch =
      normalizeText(searchTerm);

    const matchingTickets =
      ticketsForSelectedView.filter(
      (ticket) => {
        const searchableValues = [
          getTicketNumber(ticket),
          ticket.subject,
          ticket.description,
          getCustomerName(ticket),
          getCustomerEmail(ticket),
          ticket.status,
          ticket.priority,
          getDepartment(ticket),
          getAssignedAgent(ticket),
          ticket.category,
          ticket.subCategory,
          ticket.sub_category,
          ticket.channel,
          ticket.source,
        ];

        const matchesSearch =
          !normalizedSearch ||
          searchableValues.some((value) =>
            normalizeText(value).includes(
              normalizedSearch,
            ),
          );

        const matchesStatus =
          statusFilter === "All" ||
          normalizeText(ticket.status) ===
            normalizeText(statusFilter);

        const matchesPriority =
          priorityFilter === "All" ||
          normalizeText(ticket.priority) ===
            normalizeText(priorityFilter);

        const matchesDepartment =
          departmentFilter === "All" ||
          normalizeText(
            getDepartment(ticket),
          ) ===
            normalizeText(departmentFilter);

        const matchesOwner =
          ownerFilter === "All" ||
          normalizeText(
            getAssignedAgent(ticket),
          ) === normalizeText(ownerFilter);

        const matchesSla =
          slaFilter === "All" ||
          getSlaStatus(ticket).state ===
            slaFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority &&
          matchesDepartment &&
          matchesOwner &&
          matchesSla
        );
      },
    );

    return [...matchingTickets].sort(
      (firstTicket, secondTicket) => {
        if (sortBy === "oldest") {
          return (
            getCreatedTimestamp(firstTicket) -
            getCreatedTimestamp(secondTicket)
          );
        }

        if (sortBy === "priority-high") {
          return (
            (PRIORITY_ORDER[
              secondTicket.priority
            ] || 0) -
            (PRIORITY_ORDER[
              firstTicket.priority
            ] || 0)
          );
        }

        if (sortBy === "priority-low") {
          return (
            (PRIORITY_ORDER[
              firstTicket.priority
            ] || 0) -
            (PRIORITY_ORDER[
              secondTicket.priority
            ] || 0)
          );
        }

        if (sortBy === "ticket-number") {
          return getTicketNumber(
            firstTicket,
          ).localeCompare(
            getTicketNumber(secondTicket),
            undefined,
            {
              numeric: true,
            },
          );
        }

        return (
          getCreatedTimestamp(secondTicket) -
          getCreatedTimestamp(firstTicket)
        );
      },
    );
  }, [
    ticketsForSelectedView,
    searchTerm,
    statusFilter,
    priorityFilter,
    slaFilter,
    departmentFilter,
    ownerFilter,
    sortBy,
    ticketsPerPage,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredTickets.length / ticketsPerPage,
    ),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    ticketView,
    searchTerm,
    statusFilter,
    priorityFilter,
    slaFilter,
    departmentFilter,
    ownerFilter,
    sortBy,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex =
    (currentPage - 1) * ticketsPerPage;

  const paginatedTickets = useMemo(() => {
    return filteredTickets.slice(
      startIndex,
      startIndex + ticketsPerPage,
    );
  }, [
    filteredTickets,
    startIndex,
    ticketsPerPage,
  ]);

  const visibleStart =
    filteredTickets.length === 0
      ? 0
      : startIndex + 1;

  const visibleEnd = Math.min(
    startIndex + ticketsPerPage,
    filteredTickets.length,
  );

  const activeViewLabel =
    TICKET_VIEW_OPTIONS.find((option) => {
      return option.key === ticketView;
    })?.label || "Tickets";

  const handleTicketViewChange = (view) => {
    setTicketView(view);
    setStatusFilter("All");
    setCurrentPage(1);
  };

  const handleViewTicket = (ticket) => {
    const routeId =
      ticket.id ||
      ticket.ticketNumber ||
      ticket.ticket_number;

    if (!routeId) {
      console.error(
        "Cannot open ticket without an ID:",
        ticket,
      );

      return;
    }

    navigate(
      `/tickets/${encodeURIComponent(
        String(routeId),
      )}`,
    );
  };

  const handleRefresh = async () => {
    if (
      refreshing ||
      typeof loadTickets !== "function"
    ) {
      return;
    }

    setRefreshing(true);

    if (
      typeof clearTicketError === "function"
    ) {
      clearTicketError();
    }

    try {
      await loadTickets();
    } catch (refreshError) {
      console.error(
        "Unable to refresh tickets:",
        refreshError,
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setSlaFilter("All");
    setDepartmentFilter("All");
    setOwnerFilter("All");
    setSortBy("newest");
    setCurrentPage(1);

    if (
      typeof clearTicketError === "function"
    ) {
      clearTicketError();
    }
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "All" ||
    priorityFilter !== "All" ||
    slaFilter !== "All" ||
    departmentFilter !== "All" ||
    ownerFilter !== "All" ||
    sortBy !== "newest";

  const pageNumbers = useMemo(() => {
    const pages = [];

    const startPage = Math.max(
      1,
      currentPage - 2,
    );

    const endPage = Math.min(
      totalPages,
      startPage + 4,
    );

    const adjustedStartPage = Math.max(
      1,
      endPage - 4,
    );

    for (
      let page = adjustedStartPage;
      page <= endPage;
      page += 1
    ) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="crm-tickets-page">
      <header className="crm-page-header">
        <div className="crm-page-heading">
          <span className="crm-page-eyebrow">
            Complaint Management
          </span>

          <h1>Tickets</h1>

          <p>
            View, search, create and manage customer
            complaint tickets.
          </p>
        </div>

        <div className="crm-page-actions">
          <button
            type="button"
            className="crm-secondary-action"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <button
            type="button"
            className="crm-primary-action"
            onClick={() =>
              setShowCreateTicket(true)
            }
          >
            Create Ticket
          </button>
        </div>
      </header>

      <section className="crm-ticket-statistics">
        <article className="crm-ticket-stat-card">
          <span>Total tickets</span>
          <strong>
            {ticketStatistics.total}
          </strong>
          <small>All complaint tickets</small>
        </article>

        <article className="crm-ticket-stat-card">
          <span>Open</span>
          <strong>
            {ticketStatistics.open}
          </strong>
          <small>Awaiting action</small>
        </article>

        <article className="crm-ticket-stat-card">
          <span>In progress</span>
          <strong>
            {ticketStatistics.inProgress}
          </strong>
          <small>Currently being handled</small>
        </article>

        <article className="crm-ticket-stat-card">
          <span>Pending</span>
          <strong>
            {ticketStatistics.pending}
          </strong>
          <small>Waiting for response</small>
        </article>

        <article className="crm-ticket-stat-card">
          <span>Resolved</span>
          <strong>
            {ticketStatistics.resolved}
          </strong>
          <small>Resolved or closed</small>
        </article>

      </section>

      <section className="crm-ticket-workspace">
        <div
          className="crm-ticket-view-tabs"
          role="tablist"
          aria-label="Ticket views"
        >
          {TICKET_VIEW_OPTIONS.map((option) => {
            const isActive =
              ticketView === option.key;

            return (
              <button
                type="button"
                key={option.key}
                role="tab"
                aria-selected={isActive}
                className={`crm-ticket-view-tab crm-ticket-view-tab-${option.key} ${
                  isActive ? "active" : ""
                }`}
                onClick={() =>
                  handleTicketViewChange(
                    option.key,
                  )
                }
              >
                <span>{option.label}</span>

                <strong>
                  {ticketViewCounts[option.key]}
                </strong>
              </button>
            );
          })}
        </div>

        <div className="crm-ticket-toolbar">
          <div className="crm-ticket-search">
            <label htmlFor="ticket-search">
              Search tickets
            </label>

            <input
              id="ticket-search"
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value,
                )
              }
              placeholder="Search ticket number, subject, customer or email..."
            />
          </div>

          <div className="crm-ticket-filter-grid">
            <div className="crm-ticket-filter">
              <label htmlFor="status-filter">
                Status
              </label>

              <CustomSelect
                  id="status-filter"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={statusOptions}
                />
            </div>

            <div className="crm-ticket-filter">
              <label htmlFor="priority-filter">
                Priority
              </label>

              <CustomSelect
                  id="priority-filter"
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  options={priorityOptions}
                />
            </div>

            <div className="crm-ticket-filter">
              <label htmlFor="sla-filter">
                SLA Status
              </label>

              <CustomSelect
                  id="sla-filter"
                  value={slaFilter}
                  onChange={setSlaFilter}
                  options={[
                    {
                      value: "All",
                      label: "All",
                    },
                    {
                      value: "within-sla",
                      label: "Within SLA",
                    },
                    {
                      value: "near-due",
                      label: "Near deadline",
                    },
                    {
                      value: "breached",
                      label: "Overdue",
                    },
                    {
                      value: "unknown",
                      label: "Not set",
                    },
                  ]}
                />
            </div>

            <div className="crm-ticket-filter">
              <label htmlFor="department-filter">
                Department
              </label>

              <CustomSelect
                  id="department-filter"
                  value={departmentFilter}
                  onChange={setDepartmentFilter}
                  options={departmentOptions}
                />
            </div>

            <div className="crm-ticket-filter">
              <label htmlFor="owner-filter">
                Assigned Agent
              </label>

              <CustomSelect
                  id="owner-filter"
                  value={ownerFilter}
                  onChange={setOwnerFilter}
                  options={ownerOptions}
                />
            </div>

            <div className="crm-ticket-filter">
              <label htmlFor="sort-filter">
                Sort by
              </label>

              <CustomSelect
                  id="sort-filter"
                  value={sortBy}
                  onChange={setSortBy}
                  options={[
                    {
                      value: "newest",
                      label: "Newest first",
                    },
                    {
                      value: "oldest",
                      label: "Oldest first",
                    },
                    {
                      value: "priority-high",
                      label: "Highest priority",
                    },
                    {
                      value: "priority-low",
                      label: "Lowest priority",
                    },
                    {
                      value: "ticket-number",
                      label: "Ticket number",
                    },
                  ]}
                />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="crm-clear-filters"
              onClick={handleClearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {error && (
          <div
            className="crm-ticket-error"
            role="alert"
          >
            <div>
              <strong>
                Unable to load tickets
              </strong>

              <p>{error}</p>
            </div>

            <button
              type="button"
              className="crm-secondary-action"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              Try Again
            </button>
          </div>
        )}

        <div className="crm-ticket-list-card">
          <div className="crm-ticket-list-header">
            <div>
              <h2>
                {activeViewLabel} tickets
              </h2>

              <p>
                Showing {visibleStart}–
                {visibleEnd} of{" "}
                {filteredTickets.length} matching
                tickets in this view
              </p>
            </div>

            <div className="crm-ticket-list-controls">
              <label
                className="crm-page-size-control"
                htmlFor="tickets-per-page"
              >
                <span>Rows</span>

                <select
                  id="tickets-per-page"
                  value={ticketsPerPage}
                  onChange={(event) => {
                    setTicketsPerPage(
                      Number(event.target.value),
                    );
                    setCurrentPage(1);
                  }}
                >
                  {PAGE_SIZE_OPTIONS.map(
                    (pageSize) => (
                      <option
                        key={pageSize}
                        value={pageSize}
                      >
                        {pageSize}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <span className="crm-ticket-result-count">
                {filteredTickets.length}
              </span>
            </div>
          </div>

          {loading && tickets.length === 0 ? (
            <div className="crm-loading">
              <div className="crm-loading-spinner" />

              <h2>Loading tickets</h2>

              <p>
                Retrieving ticket information from
                Supabase...
              </p>
            </div>
          ) : (
            <TicketTable
              tickets={paginatedTickets}
              startIndex={startIndex}
              onView={handleViewTicket}
            />
          )}

          {!loading &&
            filteredTickets.length === 0 &&
            hasActiveFilters && (
              <div className="crm-ticket-no-results-actions">
                <button
                  type="button"
                  className="crm-secondary-action"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>

                <button
                  type="button"
                  className="crm-primary-action"
                  onClick={() =>
                    setShowCreateTicket(true)
                  }
                >
                  Create Ticket
                </button>
              </div>
            )}

          {filteredTickets.length > 0 &&
            totalPages > 1 && (
              <div className="crm-pagination">
                <div className="crm-pagination-summary">
                  Page {currentPage} of{" "}
                  {totalPages}
                </div>

                <div className="crm-pagination-buttons">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(1)
                    }
                    disabled={currentPage === 1}
                    aria-label="First page"
                  >
                    First
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (currentValue) =>
                          Math.max(
                            1,
                            currentValue - 1,
                          ),
                      )
                    }
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    Previous
                  </button>

                  {pageNumbers.map((page) => (
                    <button
                      type="button"
                      key={page}
                      className={
                        currentPage === page
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setCurrentPage(page)
                      }
                      aria-label={`Page ${page}`}
                      aria-current={
                        currentPage === page
                          ? "page"
                          : undefined
                      }
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(
                        (currentValue) =>
                          Math.min(
                            totalPages,
                            currentValue + 1,
                          ),
                      )
                    }
                    disabled={
                      currentPage === totalPages
                    }
                    aria-label="Next page"
                  >
                    Next
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(totalPages)
                    }
                    disabled={
                      currentPage === totalPages
                    }
                    aria-label="Last page"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
        </div>
      </section>

      <CreateTicketModal
        open={showCreateTicket}
        initialCustomerId={
          requestedCustomerId
        }
        onClose={
          closeCreateTicketModal
        }
      />
    </div>
  );
}