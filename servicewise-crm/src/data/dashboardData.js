const OPEN_STATUSES = new Set(["open", "new"]);
const IN_PROGRESS_STATUSES = new Set([
  "in progress",
  "in-progress",
  "working",
  "assigned",
]);
const PENDING_STATUSES = new Set([
  "pending",
  "waiting",
  "on hold",
  "on-hold",
]);
const RESOLVED_STATUSES = new Set([
  "resolved",
  "closed",
  "completed",
]);

function clean(value) {
  return String(value || "").trim().toLowerCase();
}

function getTime(value) {
  const timestamp = new Date(value || 0).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function ticketIdentifier(ticket) {
  return (
    ticket?.ticketNumber ||
    ticket?.ticket_number ||
    ticket?.id ||
    "Ticket"
  );
}

function ticketCustomerName(ticket) {
  return (
    ticket?.customer?.name ||
    ticket?.customerName ||
    ticket?.customer_name ||
    "Unknown customer"
  );
}

function formatLabel(value) {
  const text = String(value || "").trim();

  if (!text) {
    return "Uncategorised";
  }

  return text
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getDashboardStats(tickets = []) {
  const list = Array.isArray(tickets) ? tickets : [];

  const stats = {
    total: list.length,
    open: 0,
    inProgress: 0,
    pending: 0,
    resolved: 0,
    highPriority: 0,
    unassigned: 0,
  };

  list.forEach((ticket) => {
    const status = clean(ticket?.status);
    const priority = clean(ticket?.priority);
    const assignedAgent = clean(
      ticket?.assignedAgent ||
      ticket?.assignedAgentName ||
      ticket?.assigned_agent_name,
    );

    if (OPEN_STATUSES.has(status)) {
      stats.open += 1;
    } else if (IN_PROGRESS_STATUSES.has(status)) {
      stats.inProgress += 1;
    } else if (PENDING_STATUSES.has(status)) {
      stats.pending += 1;
    } else if (RESOLVED_STATUSES.has(status)) {
      stats.resolved += 1;
    }

    if (priority === "high" || priority === "critical") {
      stats.highPriority += 1;
    }

    if (
      !assignedAgent ||
      assignedAgent === "unassigned" ||
      assignedAgent === "none"
    ) {
      stats.unassigned += 1;
    }
  });

  stats.resolutionRate =
    stats.total > 0
      ? Math.round((stats.resolved / stats.total) * 100)
      : 0;

  return stats;
}

export function getPriorityBreakdown(tickets = []) {
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  (Array.isArray(tickets) ? tickets : []).forEach((ticket) => {
    const priority = clean(ticket?.priority);

    if (Object.prototype.hasOwnProperty.call(counts, priority)) {
      counts[priority] += 1;
    } else {
      counts.medium += 1;
    }
  });

  const total = Object.values(counts).reduce(
    (sum, value) => sum + value,
    0,
  );

  return [
    { key: "critical", label: "Critical", value: counts.critical },
    { key: "high", label: "High", value: counts.high },
    { key: "medium", label: "Medium", value: counts.medium },
    { key: "low", label: "Low", value: counts.low },
  ].map((item) => ({
    ...item,
    percentage:
      total > 0 ? Math.round((item.value / total) * 100) : 0,
  }));
}

export function getCategoryBreakdown(tickets = []) {
  const counts = new Map();

  (Array.isArray(tickets) ? tickets : []).forEach((ticket) => {
    const rawCategory =
      ticket?.category ||
      ticket?.complaintCategory ||
      ticket?.complaint_category ||
      ticket?.issueCategory ||
      ticket?.issue_category ||
      "Uncategorised";

    const label = formatLabel(rawCategory);
    counts.set(label, (counts.get(label) || 0) + 1);
  });

  const total = Array.from(counts.values()).reduce(
    (sum, value) => sum + value,
    0,
  );

  return Array.from(counts.entries())
    .map(([label, value]) => ({
      key: clean(label).replace(/\s+/g, "-"),
      label,
      value,
      percentage:
        total > 0 ? Math.round((value / total) * 100) : 0,
    }))
    .sort((first, second) => {
      if (second.value !== first.value) {
        return second.value - first.value;
      }

      return first.label.localeCompare(second.label);
    });
}

export function getRecentTickets(tickets = [], limit = 6) {
  return [...(Array.isArray(tickets) ? tickets : [])]
    .sort((first, second) => {
      const firstTime = getTime(
        first?.updatedAt ||
        first?.updated_at ||
        first?.createdAt ||
        first?.created_at,
      );
      const secondTime = getTime(
        second?.updatedAt ||
        second?.updated_at ||
        second?.createdAt ||
        second?.created_at,
      );

      return secondTime - firstTime;
    })
    .slice(0, limit);
}

export function getRecentActivities(tickets = [], limit = 8) {
  const activityRows = [];

  (Array.isArray(tickets) ? tickets : []).forEach((ticket) => {
    const identifier = ticketIdentifier(ticket);
    const customerName = ticketCustomerName(ticket);
    const ticketActivities = Array.isArray(ticket?.activities)
      ? ticket.activities
      : [];

    if (ticketActivities.length > 0) {
      ticketActivities.forEach((activity) => {
        activityRows.push({
          id:
            activity?.id ||
            `${ticket?.id}-${activityRows.length}-${activity?.createdAt || ""}`,
          ticketId: ticket?.id,
          ticketNumber: identifier,
          customerName,
          text:
            activity?.action ||
            activity?.message ||
            activity?.type ||
            "Ticket updated",
          user:
            activity?.user ||
            activity?.createdBy ||
            activity?.agent ||
            "ServiceWise CRM",
          createdAt:
            activity?.createdAt ||
            activity?.created_at ||
            ticket?.updatedAt ||
            ticket?.updated_at ||
            ticket?.createdAt ||
            ticket?.created_at,
        });
      });
      return;
    }

    activityRows.push({
      id: `ticket-${ticket?.id}`,
      ticketId: ticket?.id,
      ticketNumber: identifier,
      customerName,
      text: `Ticket is ${ticket?.status || "Open"}`,
      user:
        ticket?.assignedAgent ||
        ticket?.assignedAgentName ||
        "ServiceWise CRM",
      createdAt:
        ticket?.updatedAt ||
        ticket?.updated_at ||
        ticket?.createdAt ||
        ticket?.created_at,
    });
  });

  return activityRows
    .sort(
      (first, second) =>
        getTime(second.createdAt) - getTime(first.createdAt),
    )
    .slice(0, limit);
}

export function formatDashboardDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
