function startOfDay(date) {
  const value = new Date(date);

  value.setHours(0, 0, 0, 0);

  return value;
}

function endOfDay(date) {
  const value = new Date(date);

  value.setHours(23, 59, 59, 999);

  return value;
}

function startOfWeek(date) {
  const value = startOfDay(date);
  const day = value.getDay();
  const difference = day === 0 ? -6 : 1 - day;

  value.setDate(value.getDate() + difference);

  return value;
}

function startOfMonth(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
    0,
    0,
    0,
    0,
  );
}

function endOfMonth(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
}

function parseDateOnly(value, end = false) {
  if (!value) {
    return null;
  }

  const parts = String(value)
    .split("-")
    .map(Number);

  if (
    parts.length !== 3 ||
    parts.some((part) => !Number.isFinite(part))
  ) {
    return null;
  }

  const [year, month, day] = parts;

  return new Date(
    year,
    month - 1,
    day,
    end ? 23 : 0,
    end ? 59 : 0,
    end ? 59 : 0,
    end ? 999 : 0,
  );
}

export function getTicketDashboardDate(ticket) {
  const value =
    ticket?.createdAt ||
    ticket?.created_at ||
    ticket?.dateCreated ||
    ticket?.date_created ||
    ticket?.updatedAt ||
    ticket?.updated_at;

  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed;
}

export function getDashboardDateRange(
  rangeType,
  customStart = "",
  customEnd = "",
) {
  const now = new Date();

  switch (rangeType) {
    case "weekly":
      return {
        start: startOfWeek(now),
        end: endOfDay(now),
      };

    case "monthly":
      return {
        start: startOfMonth(now),
        end: endOfDay(now),
      };

    case "last-month": {
      const previousMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );

      return {
        start: startOfMonth(previousMonth),
        end: endOfMonth(previousMonth),
      };
    }

    case "custom":
      return {
        start: parseDateOnly(customStart),
        end: parseDateOnly(customEnd, true),
      };

    case "today":
    default:
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };
  }
}

export function filterTicketsByDashboardRange(
  tickets,
  rangeType,
  customStart = "",
  customEnd = "",
) {
  const rows = Array.isArray(tickets)
    ? tickets
    : [];

  const { start, end } =
    getDashboardDateRange(
      rangeType,
      customStart,
      customEnd,
    );

  if (!start || !end) {
    return rows;
  }

  return rows.filter((ticket) => {
    const ticketDate =
      getTicketDashboardDate(ticket);

    if (!ticketDate) {
      return false;
    }

    return (
      ticketDate >= start &&
      ticketDate <= end
    );
  });
}

function formatDate(date) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-PK",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

export function getDashboardRangeLabel(
  rangeType,
  customStart = "",
  customEnd = "",
) {
  const { start, end } =
    getDashboardDateRange(
      rangeType,
      customStart,
      customEnd,
    );

  switch (rangeType) {
    case "weekly":
      return `Weekly · ${formatDate(
        start,
      )} – ${formatDate(end)}`;

    case "monthly":
      return `Monthly · ${formatDate(
        start,
      )} – ${formatDate(end)}`;

    case "last-month":
      return `Last Month · ${formatDate(
        start,
      )} – ${formatDate(end)}`;

    case "custom":
      if (!start || !end) {
        return "Custom Range";
      }

      return `Custom Range · ${formatDate(
        start,
      )} – ${formatDate(end)}`;

    case "today":
    default:
      return `Today · ${formatDate(start)}`;
  }
}
