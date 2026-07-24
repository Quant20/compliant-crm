const CLOSED_STATUSES = new Set([
  "closed",
  "resolved",
  "irrelevant",
  "ignored",
  "not concerned",
  "not-concerned",
  "not relevant",
  "not-relevant",
]);

function cleanValue(value) {
  return String(value ?? "").trim();
}

function toTimestamp(value) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : null;
}

function toPositiveNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) &&
    number > 0
    ? number
    : null;
}

function getCreatedTimestamp(ticket) {
  return toTimestamp(
    ticket?.createdAt ||
      ticket?.created_at ||
      ticket?.received_at ||
      ticket?.dateCreated,
  );
}

function getExplicitDueTimestamp(ticket) {
  return toTimestamp(
    ticket?.sla?.dueAt ||
      ticket?.sla?.deadline ||
      ticket?.slaDueAt ||
      ticket?.sla_due_at ||
      ticket?.dueAt ||
      ticket?.due_at ||
      ticket?.deadline,
  );
}

function parseHoursFromText(value) {
  const text = cleanValue(value);

  if (!text) {
    return null;
  }

  const match = text.match(
    /(\d+(?:\.\d+)?)\s*(hour|hours|hr|hrs|h)\b/i,
  );

  if (!match) {
    return null;
  }

  return toPositiveNumber(match[1]);
}

export function getSlaHours(ticket) {
  const directHours =
    toPositiveNumber(ticket?.slaHours) ||
    toPositiveNumber(ticket?.sla_hours) ||
    toPositiveNumber(
      ticket?.sla?.hours,
    ) ||
    toPositiveNumber(
      ticket?.sla?.resolutionHours,
    );

  if (directHours) {
    return directHours;
  }

  return (
    parseHoursFromText(
      ticket?.sla?.resolutionTarget,
    ) ||
    parseHoursFromText(
      ticket?.sla?.responseTarget,
    ) ||
    parseHoursFromText(ticket?.sla) ||
    null
  );
}

export function getSlaDueTimestamp(ticket) {
  const explicitDueTimestamp =
    getExplicitDueTimestamp(ticket);

  if (explicitDueTimestamp) {
    return explicitDueTimestamp;
  }

  const createdTimestamp =
    getCreatedTimestamp(ticket);

  const slaHours = getSlaHours(ticket);

  if (!createdTimestamp || !slaHours) {
    return null;
  }

  return (
    createdTimestamp +
    slaHours * 60 * 60 * 1000
  );
}

function formatDuration(milliseconds) {
  const absoluteMilliseconds =
    Math.abs(milliseconds);

  const totalMinutes = Math.max(
    1,
    Math.ceil(
      absoluteMilliseconds /
        (60 * 1000),
    ),
  );

  const days = Math.floor(
    totalMinutes / (24 * 60),
  );

  const hours = Math.floor(
    (totalMinutes % (24 * 60)) / 60,
  );

  const minutes =
    totalMinutes % 60;

  if (days > 0) {
    return hours > 0
      ? `${days}d ${hours}h`
      : `${days}d`;
  }

  if (hours > 0) {
    return minutes > 0
      ? `${hours}h ${minutes}m`
      : `${hours}h`;
  }

  return `${minutes}m`;
}

export function getSlaStatus(
  ticket,
  now = Date.now(),
) {
  const status = cleanValue(
    ticket?.status,
  ).toLowerCase();

  const dueTimestamp =
    getSlaDueTimestamp(ticket);

  const slaHours = getSlaHours(ticket);

  if (CLOSED_STATUSES.has(status)) {
    return {
      state: "completed",
      tone: "neutral",
      label: "Completed",
      dueTimestamp,
      remainingMilliseconds: null,
      slaHours,
      breached: false,
      nearDue: false,
    };
  }

  if (!dueTimestamp) {
    return {
      state: "unknown",
      tone: "neutral",
      label: "Not set",
      dueTimestamp: null,
      remainingMilliseconds: null,
      slaHours,
      breached: false,
      nearDue: false,
    };
  }

  const remainingMilliseconds =
    dueTimestamp - now;

  if (remainingMilliseconds <= 0) {
    return {
      state: "breached",
      tone: "danger",
      label: `${formatDuration(
        remainingMilliseconds,
      )} overdue`,
      dueTimestamp,
      remainingMilliseconds,
      slaHours,
      breached: true,
      nearDue: false,
    };
  }

  const nearDueThreshold =
    Math.max(
      60 * 60 * 1000,
      (slaHours || 8) *
        60 *
        60 *
        1000 *
        0.25,
    );

  const nearDue =
    remainingMilliseconds <=
    nearDueThreshold;

  return {
    state: nearDue
      ? "near-due"
      : "within-sla",
    tone: nearDue
      ? "warning"
      : "success",
    label: `${formatDuration(
      remainingMilliseconds,
    )} left`,
    dueTimestamp,
    remainingMilliseconds,
    slaHours,
    breached: false,
    nearDue,
  };
}

export function formatSlaDeadline(
  dueTimestamp,
) {
  if (!dueTimestamp) {
    return "SLA deadline not available";
  }

  return new Intl.DateTimeFormat(
    "en-PK",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    },
  ).format(new Date(dueTimestamp));
}
