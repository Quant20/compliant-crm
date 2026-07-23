import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import seedTickets from "../data/tickets";
import {
  createManualSupabaseTicket,
  deleteSupabaseTicket,
  getSupabaseTickets,
  subscribeToTicketChanges,
  updateSupabaseTicket,
} from "../services/supabaseTicketService";
import { isSupabaseConfigured } from "../services/supabaseClient";

const TicketContext = createContext(undefined);

const TICKETS_STORAGE_KEY = "servicewise_recovered_tickets";

function parseStoredTickets() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const value = window.localStorage.getItem(TICKETS_STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to read locally recovered tickets:", error);
    return [];
  }
}

function writeStoredTickets(ticketList) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      TICKETS_STORAGE_KEY,
      JSON.stringify(ticketList),
    );
  } catch (error) {
    console.error("Unable to save locally recovered tickets:", error);
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeTicket(ticket) {
  if (!ticket) {
    return ticket;
  }

  const messages = asArray(
    ticket.messages || ticket.conversations,
  );
  const notes = asArray(
    ticket.comments || ticket.internalNotes,
  );

  return {
    ...ticket,
    id:
      ticket.id ||
      ticket.ticketNumber ||
      ticket.ticket_number ||
      Date.now(),
    ticketNumber:
      ticket.ticketNumber ||
      ticket.ticket_number ||
      "",
    customer: {
      ...(ticket.customer || {}),
      id:
        ticket.customer?.id ||
        ticket.customer_id ||
        null,
      name:
        ticket.customer?.name ||
        ticket.customer_name ||
        ticket.customerName ||
        "Unknown customer",
      email:
        ticket.customer?.email ||
        ticket.customer_email ||
        ticket.customerEmail ||
        "",
      phone:
        ticket.customer?.phone ||
        ticket.customer_phone ||
        ticket.customerPhone ||
        "",
    },
    assignedAgent:
      ticket.assignedAgent ||
      ticket.assignedAgentName ||
      ticket.assigned_agent_name ||
      "Unassigned",
    assignedAgentName:
      ticket.assignedAgentName ||
      ticket.assignedAgent ||
      ticket.assigned_agent_name ||
      "Unassigned",
    createdAt:
      ticket.createdAt ||
      ticket.created_at ||
      ticket.received_at ||
      new Date().toISOString(),
    updatedAt:
      ticket.updatedAt ||
      ticket.updated_at ||
      ticket.createdAt ||
      ticket.created_at ||
      new Date().toISOString(),
    messages,
    conversations: messages,
    comments: notes,
    internalNotes: notes,
    activities: asArray(ticket.activities),
  };
}

function getTicketTime(ticket) {
  const value =
    ticket?.createdAt ||
    ticket?.created_at ||
    ticket?.received_at ||
    0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sortTicketsNewestFirst(ticketList) {
  return [...ticketList].sort(
    (firstTicket, secondTicket) =>
      getTicketTime(secondTicket) - getTicketTime(firstTicket),
  );
}

function mergePreservedLocalFields(serverTicket, localTicket) {
  if (!localTicket) {
    return normalizeTicket(serverTicket);
  }

  const normalizedServer = normalizeTicket(serverTicket);
  const normalizedLocal = normalizeTicket(localTicket);

  return {
    ...normalizedLocal,
    ...normalizedServer,
    customer: {
      ...normalizedLocal.customer,
      ...normalizedServer.customer,
    },
    messages:
      normalizedLocal.messages.length > 0
        ? normalizedLocal.messages
        : normalizedServer.messages,
    conversations:
      normalizedLocal.conversations.length > 0
        ? normalizedLocal.conversations
        : normalizedServer.conversations,
    comments:
      normalizedLocal.comments.length > 0
        ? normalizedLocal.comments
        : normalizedServer.comments,
    internalNotes:
      normalizedLocal.internalNotes.length > 0
        ? normalizedLocal.internalNotes
        : normalizedServer.internalNotes,
    activities:
      normalizedLocal.activities.length > 0
        ? normalizedLocal.activities
        : normalizedServer.activities,
  };
}

function createLocalTicket(ticketData) {
  const now = new Date();
  const id = Date.now();

  return normalizeTicket({
    ...ticketData,
    id,
    ticketNumber:
      ticketData.ticketNumber ||
      `TKT-${String(id).slice(-6)}`,
    status: ticketData.status || "Open",
    priority: ticketData.priority || "Medium",
    source: ticketData.source || "Manual",
    channel: ticketData.channel || "Manual",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    messages: [],
    comments: [],
    activities: [
      {
        id: id + 1,
        type: "created",
        action: "Ticket created",
        user: "ServiceWise CRM",
        time: now.toLocaleString("en-PK"),
        createdAt: now.toISOString(),
      },
    ],
  });
}

export function TicketProvider({ children }) {
  const [tickets, setTickets] = useState(() => {
    const storedTickets = parseStoredTickets();
    const initialTickets =
      storedTickets.length > 0 ? storedTickets : seedTickets;

    return sortTicketsNewestFirst(
      initialTickets.map(normalizeTicket),
    );
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dataSource, setDataSource] = useState(
    isSupabaseConfigured ? "supabase" : "local",
  );

  useEffect(() => {
    writeStoredTickets(tickets);
  }, [tickets]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");

    if (!isSupabaseConfigured) {
      setDataSource("local");
      setLoading(false);
      return tickets;
    }

    try {
      const loadedTickets = await getSupabaseTickets();

      setTickets((currentTickets) => {
        const currentById = new Map(
          currentTickets.map((ticket) => [String(ticket.id), ticket]),
        );

        const mergedTickets = loadedTickets.map((ticket) =>
          mergePreservedLocalFields(
            ticket,
            currentById.get(String(ticket.id)),
          ),
        );

        const nextTickets = sortTicketsNewestFirst(mergedTickets);
        writeStoredTickets(nextTickets);
        return nextTickets;
      });

      setDataSource("supabase");
      return loadedTickets;
    } catch (loadError) {
      console.error("Unable to load Supabase tickets:", loadError);
      setDataSource("local");
      setError(
        `Supabase could not be reached, so locally recovered tickets are being shown. ${
          loadError?.message || ""
        }`.trim(),
      );
      return tickets;
    } finally {
      setLoading(false);
    }
  }, [tickets]);

  useEffect(() => {
    loadTickets();
  }, []); // Run once when the recovered application starts.

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined;
    }

    return subscribeToTicketChanges({
      onInsert: (newTicket) => {
        const normalizedTicket = normalizeTicket(newTicket);

        setTickets((currentTickets) => {
          const exists = currentTickets.some(
            (ticket) => String(ticket.id) === String(normalizedTicket.id),
          );

          return exists
            ? currentTickets
            : sortTicketsNewestFirst([
                normalizedTicket,
                ...currentTickets,
              ]);
        });
      },
      onUpdate: (updatedTicket) => {
        setTickets((currentTickets) =>
          sortTicketsNewestFirst(
            currentTickets.map((ticket) =>
              String(ticket.id) === String(updatedTicket.id)
                ? mergePreservedLocalFields(updatedTicket, ticket)
                : ticket,
            ),
          ),
        );
      },
      onDelete: (deletedTicketId) => {
        setTickets((currentTickets) =>
          currentTickets.filter(
            (ticket) =>
              String(ticket.id) !== String(deletedTicketId),
          ),
        );
      },
    });
  }, []);

  const createTicket = useCallback(async (ticketData) => {
    setError("");

    let createdTicket;

    if (isSupabaseConfigured) {
      try {
        createdTicket = normalizeTicket(
          await createManualSupabaseTicket(ticketData),
        );
        setDataSource("supabase");
      } catch (createError) {
        console.error("Supabase ticket creation failed:", createError);
        createdTicket = createLocalTicket(ticketData);
        setDataSource("local");
        setError(
          `Ticket was saved locally because Supabase creation failed. ${
            createError?.message || ""
          }`.trim(),
        );
      }
    } else {
      createdTicket = createLocalTicket(ticketData);
      setDataSource("local");
    }

    setTickets((currentTickets) => {
      const withoutDuplicate = currentTickets.filter(
        (ticket) => String(ticket.id) !== String(createdTicket.id),
      );
      return sortTicketsNewestFirst([
        createdTicket,
        ...withoutDuplicate,
      ]);
    });

    return createdTicket;
  }, []);

  const updateTicket = useCallback(async (ticketId, updates) => {
    setError("");

    let previousTicket = null;

    setTickets((currentTickets) =>
      currentTickets.map((ticket) => {
        if (String(ticket.id) !== String(ticketId)) {
          return ticket;
        }

        previousTicket = ticket;
        return normalizeTicket({
          ...ticket,
          ...updates,
          customer: {
            ...(ticket.customer || {}),
            ...(updates.customer || {}),
          },
          updatedAt: new Date().toISOString(),
        });
      }),
    );

    if (!isSupabaseConfigured) {
      setDataSource("local");
      return {
        ...previousTicket,
        ...updates,
      };
    }

    try {
      const serverTicket = await updateSupabaseTicket(ticketId, updates);
      const normalizedTicket = mergePreservedLocalFields(
        serverTicket,
        {
          ...previousTicket,
          ...updates,
        },
      );

      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          String(ticket.id) === String(ticketId)
            ? normalizedTicket
            : ticket,
        ),
      );

      setDataSource("supabase");
      return normalizedTicket;
    } catch (updateError) {
      console.error("Supabase ticket update failed:", updateError);
      setDataSource("local");
      setError(
        `The update is saved locally, but Supabase could not be updated. ${
          updateError?.message || ""
        }`.trim(),
      );
      return {
        ...previousTicket,
        ...updates,
      };
    }
  }, []);

  const deleteTicket = useCallback(async (ticketId) => {
    setError("");

    setTickets((currentTickets) =>
      currentTickets.filter(
        (ticket) => String(ticket.id) !== String(ticketId),
      ),
    );

    if (!isSupabaseConfigured) {
      setDataSource("local");
      return ticketId;
    }

    try {
      await deleteSupabaseTicket(ticketId);
      setDataSource("supabase");
    } catch (deleteError) {
      console.error("Supabase ticket deletion failed:", deleteError);
      setDataSource("local");
      setError(
        `The ticket was removed locally, but Supabase could not be updated. ${
          deleteError?.message || ""
        }`.trim(),
      );
    }

    return ticketId;
  }, []);

  const appendTicketItem = useCallback(
    (ticketId, item, primaryField, aliasField) => {
      const nextItem = {
        id: item?.id || Date.now(),
        ...item,
        createdAt: item?.createdAt || new Date().toISOString(),
      };

      setTickets((currentTickets) =>
        currentTickets.map((ticket) => {
          if (String(ticket.id) !== String(ticketId)) {
            return ticket;
          }

          const currentItems = asArray(
            ticket[primaryField] || ticket[aliasField],
          );
          const nextItems = [...currentItems, nextItem];

          return {
            ...ticket,
            [primaryField]: nextItems,
            [aliasField]: nextItems,
            updatedAt: new Date().toISOString(),
          };
        }),
      );

      return nextItem;
    },
    [],
  );

  const addConversation = useCallback(
    async (ticketId, conversation) =>
      appendTicketItem(
        ticketId,
        conversation,
        "messages",
        "conversations",
      ),
    [appendTicketItem],
  );

  const addInternalNote = useCallback(
    async (ticketId, note) =>
      appendTicketItem(
        ticketId,
        note,
        "comments",
        "internalNotes",
      ),
    [appendTicketItem],
  );

  const addActivity = useCallback(
    async (ticketId, activity) => {
      const nextActivity = {
        id: activity?.id || Date.now(),
        ...activity,
        createdAt:
          activity?.createdAt || new Date().toISOString(),
      };

      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          String(ticket.id) === String(ticketId)
            ? {
                ...ticket,
                activities: [
                  ...asArray(ticket.activities),
                  nextActivity,
                ],
                updatedAt: new Date().toISOString(),
              }
            : ticket,
        ),
      );

      return nextActivity;
    },
    [],
  );

  const clearTicketError = useCallback(() => {
    setError("");
  }, []);

  const value = useMemo(
    () => ({
      tickets,
      loading,
      error,
      dataSource,
      loadTickets,
      createTicket,
      updateTicket,
      deleteTicket,
      addConversation,
      addInternalNote,
      addActivity,
      clearTicketError,
    }),
    [
      tickets,
      loading,
      error,
      dataSource,
      loadTickets,
      createTicket,
      updateTicket,
      deleteTicket,
      addConversation,
      addInternalNote,
      addActivity,
      clearTicketError,
    ],
  );

  return (
    <TicketContext.Provider value={value}>
      {children}
    </TicketContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketContext);

  if (!context) {
    throw new Error("useTickets must be used inside TicketProvider.");
  }

  return context;
}
