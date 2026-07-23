import "./Tickets.css";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { useTickets } from "../../context/TicketContext";

import TicketTable from "../../components/tickets/TicketTable";
import CreateTicketModal from "../../components/tickets/CreateTicketModal";

const ITEMS_PER_PAGE = 10;

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
  return (
    ticket.assignedAgent ||
    ticket.assignedAgentName ||
    ticket.assigned_agent_name ||
    "Unassigned"
  );
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

export default function Tickets() {
  const navigate = useNavigate();

  const {
    tickets = [],
    loading = false,
    error = "",
    loadTickets,
    clearTicketError,
  } = useTickets();

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [priorityFilter, setPriorityFilter] =
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
    showCreateTicket,
    setShowCreateTicket,
  ] = useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const statusOptions = useMemo(() => {
    const values = tickets
      .map((ticket) => ticket.status)
      .filter(Boolean);

    return [
      "All",
      ...Array.from(new Set(values)).sort(),
    ];
  }, [tickets]);

  const priorityOptions = useMemo(() => {
    const values = tickets
      .map((ticket) => ticket.priority)
      .filter(Boolean);

    return [
      "All",
      ...Array.from(new Set(values)).sort(
        (firstPriority, secondPriority) => {
          return (
            (PRIORITY_ORDER[secondPriority] ||
              0) -
            (PRIORITY_ORDER[firstPriority] ||
              0)
          );
        },
      ),
    ];
  }, [tickets]);

  const departmentOptions = useMemo(() => {
    const values = tickets
      .map(getDepartment)
      .filter(Boolean);

    return [
      "All",
      ...Array.from(new Set(values)).sort(),
    ];
  }, [tickets]);

  const ownerOptions = useMemo(() => {
    const values = tickets
      .map(getAssignedAgent)
      .filter(Boolean);

    return [
      "All",
      ...Array.from(new Set(values)).sort(),
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

    const critical = tickets.filter(
      (ticket) => {
        return (
          normalizeText(ticket.priority) ===
          "critical"
        );
      },
    ).length;

    return {
      total,
      open,
      inProgress,
      pending,
      resolved,
      critical,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const normalizedSearch =
      normalizeText(searchTerm);

    const matchingTickets = tickets.filter(
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

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority &&
          matchesDepartment &&
          matchesOwner
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
    tickets,
    searchTerm,
    statusFilter,
    priorityFilter,
    departmentFilter,
    ownerFilter,
    sortBy,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredTickets.length / ITEMS_PER_PAGE,
    ),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    priorityFilter,
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
    (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedTickets = useMemo(() => {
    return filteredTickets.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    );
  }, [filteredTickets, startIndex]);

  const visibleStart =
    filteredTickets.length === 0
      ? 0
      : startIndex + 1;

  const visibleEnd = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredTickets.length,
  );

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

        <article className="crm-ticket-stat-card">
          <span>Critical</span>
          <strong>
            {ticketStatistics.critical}
          </strong>
          <small>Needs urgent attention</small>
        </article>
      </section>

      <section className="crm-ticket-workspace">
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

              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value,
                  )
                }
              >
                {statusOptions.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="crm-ticket-filter">
              <label htmlFor="priority-filter">
                Priority
              </label>

              <select
                id="priority-filter"
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(
                    event.target.value,
                  )
                }
              >
                {priorityOptions.map(
                  (priority) => (
                    <option
                      key={priority}
                      value={priority}
                    >
                      {priority}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="crm-ticket-filter">
              <label htmlFor="department-filter">
                Department
              </label>

              <select
                id="department-filter"
                value={departmentFilter}
                onChange={(event) =>
                  setDepartmentFilter(
                    event.target.value,
                  )
                }
              >
                {departmentOptions.map(
                  (department) => (
                    <option
                      key={department}
                      value={department}
                    >
                      {department}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="crm-ticket-filter">
              <label htmlFor="owner-filter">
                Owner
              </label>

              <select
                id="owner-filter"
                value={ownerFilter}
                onChange={(event) =>
                  setOwnerFilter(
                    event.target.value,
                  )
                }
              >
                {ownerOptions.map((owner) => (
                  <option
                    key={owner}
                    value={owner}
                  >
                    {owner}
                  </option>
                ))}
              </select>
            </div>

            <div className="crm-ticket-filter">
              <label htmlFor="sort-filter">
                Sort by
              </label>

              <select
                id="sort-filter"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value)
                }
              >
                <option value="newest">
                  Newest first
                </option>

                <option value="oldest">
                  Oldest first
                </option>

                <option value="priority-high">
                  Highest priority
                </option>

                <option value="priority-low">
                  Lowest priority
                </option>

                <option value="ticket-number">
                  Ticket number
                </option>
              </select>
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
              <h2>All tickets</h2>

              <p>
                Showing {visibleStart}–
                {visibleEnd} of{" "}
                {filteredTickets.length} matching
                tickets
              </p>
            </div>

            <span className="crm-ticket-result-count">
              {filteredTickets.length}
            </span>
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
        onClose={() =>
          setShowCreateTicket(false)
        }
      />
    </div>
  );
}