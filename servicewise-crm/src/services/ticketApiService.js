const API_BASE_URL =
  import.meta.env.VITE_API_URL || "";

async function readResponse(response) {
  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok || !data?.success) {
    throw new Error(
      data?.message ||
        data?.error ||
        `Ticket request failed with status ${response.status}.`,
    );
  }

  return data.data;
}

export async function createServerTicket(
  ticketData,
) {
  const payload = {
    ...ticketData,

    customerName:
      ticketData.customerName ||
      ticketData.customer_name ||
      ticketData.customer?.name ||
      "",

    customerEmail:
      ticketData.customerEmail ||
      ticketData.customer_email ||
      ticketData.customer?.email ||
      "",

    customerPhone:
      ticketData.customerPhone ||
      ticketData.customer_phone ||
      ticketData.customer?.phone ||
      "",

    channel:
      ticketData.channel ||
      ticketData.source ||
      "Manual",
  };

  const requestedAgent = String(
    payload.assignedAgent ||
      payload.assignedAgentName ||
      payload.assigned_agent_name ||
      "",
  ).trim();

  if (
    !requestedAgent ||
    requestedAgent.toLowerCase() ===
      "unassigned"
  ) {
    delete payload.assignedAgent;
    delete payload.assignedAgentName;
    delete payload.assigned_agent_name;
    delete payload.assignedAgentId;
    delete payload.assigned_agent_id;
  }

  const response = await fetch(
    `${API_BASE_URL}/api/tickets`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    },
  );

  return readResponse(response);
}

export async function updateServerTicket(
  ticketId,
  changes,
) {
  const response = await fetch(
    `${API_BASE_URL}/api/tickets/${encodeURIComponent(
      ticketId,
    )}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(changes),
    },
  );

  return readResponse(response);
}
