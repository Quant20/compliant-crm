import {
  assertSupabaseConfigured,
  supabase,
} from "./supabaseClient";

const TICKETS_TABLE = "tickets";

function parseArrayValue(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function firstRow(data) {
  return Array.isArray(data) && data.length > 0
    ? data[0]
    : null;
}

function createTicketNumber() {
  const date = new Date();
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const suffix = String(Date.now()).slice(-5);

  return `TKT-${year}${month}${day}-${suffix}`;
}

function getCustomer(ticket) {
  return ticket?.customer || {};
}

export function mapSupabaseTicket(ticket) {
  if (!ticket) {
    return ticket;
  }

  const messages = parseArrayValue(
    ticket.messages || ticket.conversations,
  );

  const comments = parseArrayValue(
    ticket.comments || ticket.internal_notes,
  );

  const activities = parseArrayValue(
    ticket.activities,
  );

  return {
    ...ticket,

    ticketNumber:
      ticket.ticket_number ||
      ticket.ticketNumber ||
      "",

    customer: {
      id:
        ticket.customer_id ||
        ticket.customer?.id ||
        null,
      name:
        ticket.customer_name ||
        ticket.customerName ||
        ticket.customer?.name ||
        "",
      email:
        ticket.customer_email ||
        ticket.customerEmail ||
        ticket.customer?.email ||
        "",
      phone:
        ticket.customer_phone ||
        ticket.customerPhone ||
        ticket.customer?.phone ||
        "",
    },

    assignedAgent:
      ticket.assigned_agent_name ||
      ticket.assignedAgentName ||
      ticket.assignedAgent ||
      "Unassigned",

    assignedAgentName:
      ticket.assigned_agent_name ||
      ticket.assignedAgentName ||
      ticket.assignedAgent ||
      "Unassigned",

    assignedAgentId:
      ticket.assigned_agent_id ||
      ticket.assignedAgentId ||
      null,

    createdAt:
      ticket.created_at ||
      ticket.createdAt ||
      ticket.received_at ||
      "",

    updatedAt:
      ticket.updated_at ||
      ticket.updatedAt ||
      ticket.created_at ||
      ticket.createdAt ||
      "",

    messages,
    conversations: messages,
    comments,
    internalNotes: comments,
    activities,

    emailFrom:
      ticket.email_from ||
      ticket.from_email ||
      ticket.customer_email ||
      "",

    emailTo:
      ticket.email_to ||
      ticket.to_emails ||
      [],

    emailCc:
      ticket.email_cc ||
      ticket.cc_emails ||
      [],
  };
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, item]) => item !== undefined,
    ),
  );
}

function toCreatePayload(ticketData) {
  const customer = getCustomer(ticketData);

  return compactObject({
    ticket_number:
      ticketData.ticket_number ||
      ticketData.ticketNumber ||
      createTicketNumber(),
    subject: String(ticketData.subject || "").trim(),
    description: String(
      ticketData.description || "",
    ).trim(),
    customer_id:
      ticketData.customer_id ||
      ticketData.customerId,
    customer_name:
      customer.name ||
      ticketData.customer_name ||
      ticketData.customerName ||
      "",
    customer_email:
      customer.email ||
      ticketData.customer_email ||
      ticketData.customerEmail ||
      "",
    customer_phone:
      customer.phone ||
      ticketData.customer_phone ||
      ticketData.customerPhone ||
      null,
    category:
      ticketData.category || "General",
    sub_category:
      ticketData.sub_category ||
      ticketData.subCategory ||
      ticketData.subcategory,
    priority:
      ticketData.priority || "Medium",
    status:
      ticketData.status || "Open",
    assigned_agent_name:
      ticketData.assigned_agent_name ||
      ticketData.assignedAgentName ||
      ticketData.assignedAgent ||
      "Unassigned",
    assigned_agent_id:
      ticketData.assigned_agent_id ||
      ticketData.assignedAgentId ||
      null,
    department:
      ticketData.department || "Support",
    source:
      ticketData.source ||
      ticketData.channel ||
      "Manual",
    channel:
      ticketData.channel ||
      ticketData.source ||
      "Manual",
    sla_hours:
      ticketData.sla_hours ||
      ticketData.slaHours,
    updated_at: new Date().toISOString(),
  });
}

function toUpdatePayload(updates) {
  const customer = updates.customer || {};

  return compactObject({
    ticket_number:
      updates.ticket_number ||
      updates.ticketNumber,
    subject: updates.subject,
    description: updates.description,
    customer_id:
      updates.customer_id ||
      updates.customerId,
    customer_name:
      customer.name ||
      updates.customer_name ||
      updates.customerName,
    customer_email:
      customer.email ||
      updates.customer_email ||
      updates.customerEmail,
    customer_phone:
      customer.phone ||
      updates.customer_phone ||
      updates.customerPhone,
    category: updates.category,
    sub_category:
      updates.sub_category ||
      updates.subCategory ||
      updates.subcategory,
    priority: updates.priority,
    status: updates.status,
    assigned_agent_name:
      updates.assigned_agent_name ||
      updates.assignedAgentName ||
      updates.assignedAgent,
    assigned_agent_id:
      updates.assigned_agent_id ||
      updates.assignedAgentId,
    department: updates.department,
    source: updates.source,
    channel: updates.channel,
    sla_hours:
      updates.sla_hours ||
      updates.slaHours,
    updated_at: new Date().toISOString(),
  });
}

function findUnknownColumn(error) {
  const message = String(
    error?.message || error?.details || "",
  );

  const patterns = [
    /Could not find the ['\"]([^'\"]+)['\"] column/i,
    /column ['\"]?([^'\"\s]+)['\"]? does not exist/i,
    /column [^\.]+\.([^\s]+) does not exist/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);

    if (match?.[1]) {
      return match[1].replace(/["']/g, "");
    }
  }

  return "";
}

async function executePayloadQuery(
  payload,
  buildQuery,
) {
  const currentPayload = { ...payload };
  const removedColumns = [];

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data, error } = await buildQuery(
      currentPayload,
    );

    if (!error) {
      return { data, removedColumns };
    }

    const unknownColumn = findUnknownColumn(error);

    if (
      !unknownColumn ||
      !(unknownColumn in currentPayload)
    ) {
      throw error;
    }

    delete currentPayload[unknownColumn];
    removedColumns.push(unknownColumn);
  }

  throw new Error(
    "The ticket query could not be completed because the database schema does not match the application fields.",
  );
}

export async function getSupabaseTickets() {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from(TICKETS_TABLE)
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data || []).map(mapSupabaseTicket);
}

export async function createManualSupabaseTicket(
  ticketData,
) {
  assertSupabaseConfigured();

  const payload = toCreatePayload(ticketData);

  if (!payload.subject || !payload.description) {
    throw new Error(
      "Ticket subject and description are required.",
    );
  }

  const { data } = await executePayloadQuery(
    payload,
    (currentPayload) =>
      supabase
        .from(TICKETS_TABLE)
        .insert(currentPayload)
        .select("*"),
  );

  const createdTicket = firstRow(data);

  if (!createdTicket) {
    throw new Error(
      "Supabase did not return the created ticket. Check the tickets INSERT and SELECT RLS policies.",
    );
  }

  return mapSupabaseTicket(createdTicket);
}

export async function updateSupabaseTicket(
  ticketId,
  updates,
) {
  assertSupabaseConfigured();

  if (!ticketId) {
    throw new Error("Ticket ID is required.");
  }

  const payload = toUpdatePayload(updates || {});

  const { data } = await executePayloadQuery(
    payload,
    (currentPayload) =>
      supabase
        .from(TICKETS_TABLE)
        .update(currentPayload)
        .eq("id", ticketId)
        .select("*"),
  );

  const updatedTicket = firstRow(data);

  if (!updatedTicket) {
    throw new Error(
      "Supabase returned no updated ticket. Check the tickets UPDATE and SELECT RLS policies.",
    );
  }

  return mapSupabaseTicket(updatedTicket);
}

export async function deleteSupabaseTicket(
  ticketId,
) {
  assertSupabaseConfigured();

  if (!ticketId) {
    throw new Error("Ticket ID is required.");
  }

  const { error } = await supabase
    .from(TICKETS_TABLE)
    .delete()
    .eq("id", ticketId);

  if (error) {
    throw error;
  }

  return ticketId;
}

export function subscribeToTicketChanges({
  onInsert,
  onUpdate,
  onDelete,
} = {}) {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    return () => {};
  }

  const channel = supabase
    .channel("servicewise-ticket-changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: TICKETS_TABLE,
      },
      (payload) => {
        onInsert?.(
          mapSupabaseTicket(payload.new),
        );
      },
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: TICKETS_TABLE,
      },
      (payload) => {
        onUpdate?.(
          mapSupabaseTicket(payload.new),
        );
      },
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: TICKETS_TABLE,
      },
      (payload) => {
        onDelete?.(
          payload.old?.id || null,
        );
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
