import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  FaArrowRight,
  FaBan,
  FaBolt,
  FaCheck,
  FaChevronDown,
  FaComments,
  FaExternalLinkAlt,
  FaEye,
  FaEyeSlash,
  FaInbox,
  FaKeyboard,
  FaLink,
  FaPaperPlane,
  FaPlus,
  FaRedoAlt,
  FaSearch,
  FaTicketAlt,
  FaTimes,
  FaUser,
  FaUsers,
  FaWhatsapp,
} from "react-icons/fa";

import { useTickets } from "../../context/TicketContext";

import {
  MOCK_WHATSAPP_STORAGE_KEY,
  MOCK_WHATSAPP_TICKETS_KEY,
  MOCK_WHATSAPP_PENDING_KEY,
  createInitialMockConversations,
  createInitialMockTickets,
  mockIncomingScenarios,
} from "../../data/mockWhatsAppData";

import {
  buildMissingDetailsReply,
  createPendingReference,
  getMissingFields,
  parseStructuredWhatsAppMessage,
} from "../../utils/whatsAppMessageParser";

import "./WhatsAppInbox.css";

const VIEW_ALL = "all";
const VIEW_REVIEW = "review";
const VIEW_TICKETED = "ticketed";
const VIEW_IGNORED = "ignored";

const SAVED_REPLIES = [
  {
    id: "acknowledge",
    label: "Acknowledge complaint",
    text:
      "Thank you for contacting us. We have received your complaint and are reviewing the details.",
  },
  {
    id: "request-transaction",
    label: "Request transaction ID",
    text:
      "Please share the transaction ID, retailer ID, amount, and transaction date so we can investigate.",
  },
  {
    id: "request-voucher",
    label: "Request voucher details",
    text:
      "Please share the voucher ID and a clear screenshot so our team can verify the issue.",
  },
  {
    id: "under-review",
    label: "Under review",
    text:
      "Your case is under review. We will update you as soon as verification is complete.",
  },
];

const readStorage = (key, fallbackFactory) => {
  try {
    const rawValue = localStorage.getItem(key);

    if (!rawValue) {
      return fallbackFactory();
    }

    const parsedValue = JSON.parse(rawValue);

    return Array.isArray(parsedValue)
      ? parsedValue
      : fallbackFactory();
  } catch (error) {
    console.error(
      `Unable to read ${key}:`,
      error,
    );

    return fallbackFactory();
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value),
    );
  } catch (error) {
    console.error(
      `Unable to save ${key}:`,
      error,
    );
  }
};

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

const formatTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name) => {
  return String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const getMessagePreview = (body) => {
  const value = String(body || "")
    .replace(/\s+/g, " ")
    .trim();

  return value.length > 62
    ? `${value.slice(0, 62)}…`
    : value;
};

const extractReference = (body) => {
  const value = String(body || "");

  const transactionMatch = value.match(
    /\b(?:TXN|TRX|TRANSACTION)[-\s:]?\d{4,}\b/i,
  );

  const voucherMatch = value.match(
    /\b(?:VCH|VOUCHER)[-\s:]?\d{3,}\b/i,
  );

  const retailerMatch = value.match(
    /\b(?:RTL|RETAILER)[-\s:]?\d{3,}\b/i,
  );

  return {
    transactionId:
      transactionMatch?.[0]?.replace(/\s+/g, "-") ||
      "",
    voucherId:
      voucherMatch?.[0]?.replace(/\s+/g, "-") ||
      "",
    retailerId:
      retailerMatch?.[0]?.replace(/\s+/g, "-") ||
      "",
  };
};

const suggestCategory = (body) => {
  const value = normalizeText(body);

  if (
    value.includes("payment") ||
    value.includes("deducted") ||
    value.includes("transaction") ||
    value.includes("settlement")
  ) {
    return "Payment / Settlement";
  }

  if (value.includes("voucher")) {
    return "Voucher Issue";
  }

  if (
    value.includes("blocked") ||
    value.includes("kyc") ||
    value.includes("account")
  ) {
    return "Account / KYC";
  }

  if (
    value.includes("error") ||
    value.includes("app") ||
    value.includes("technical")
  ) {
    return "Technical Problem";
  }

  return "General Complaint";
};

const suggestPriority = (body) => {
  const value = normalizeText(body);

  if (
    value.includes("urgent") ||
    value.includes("blocked") ||
    value.includes("deducted") ||
    value.includes("failed")
  ) {
    return "High";
  }

  return "Medium";
};

const createSubject = (body) => {
  const value = String(body || "")
    .replace(/#[A-Z_]+/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!value) {
    return "WhatsApp complaint";
  }

  return value.length > 74
    ? `${value.slice(0, 74)}…`
    : value;
};

const getReviewLabel = (status) => {
  const labels = {
    unreviewed: "Needs review",
    ticket_created: "Ticket created",
    linked: "Linked",
    no_ticket: "Ignored",
    conversation_only: "Reply",
    awaiting_information: "Waiting for details",
  };

  return labels[status] || "Needs review";
};

const getTicketLabel = (ticket) => {
  return (
    ticket?.ticketNumber ||
    ticket?.ticket_number ||
    ticket?.id ||
    "Ticket"
  );
};

const getTicketCustomerName = (ticket) => {
  return (
    ticket?.customer?.name ||
    ticket?.customer_name ||
    ticket?.customerName ||
    ticket?.senderName ||
    ""
  );
};

const getTicketCustomerPhone = (ticket) => {
  return (
    ticket?.customer?.phone ||
    ticket?.customer_phone ||
    ticket?.customerPhone ||
    ticket?.senderPhone ||
    ""
  );
};

const getTicketText = (ticket) => {
  return [
    getTicketLabel(ticket),
    ticket?.subject,
    ticket?.title,
    ticket?.description,
    ticket?.transactionId,
    ticket?.transaction_id,
    ticket?.voucherId,
    ticket?.voucher_id,
    ticket?.retailerId,
    ticket?.retailer_id,
    getTicketCustomerName(ticket),
    getTicketCustomerPhone(ticket),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

const getMeaningfulWords = (value) => {
  const ignoredWords = new Set([
    "about",
    "after",
    "again",
    "amount",
    "been",
    "complaint",
    "customer",
    "from",
    "have",
    "issue",
    "message",
    "payment",
    "please",
    "received",
    "retailer",
    "team",
    "that",
    "this",
    "ticket",
    "transaction",
    "with",
  ]);

  return Array.from(
    new Set(
      normalizeText(value)
        .split(/[^a-z0-9]+/)
        .filter(
          (word) =>
            word.length >= 4 &&
            !ignoredWords.has(word),
        ),
    ),
  );
};

const rankRelatedTickets = (
  message,
  tickets,
) => {
  if (!message) {
    return [];
  }

  const references = extractReference(
    message.body,
  );

  const messageWords = getMeaningfulWords(
    message.body,
  );

  const senderName = normalizeText(
    message.senderName,
  );

  const senderPhone = String(
    message.senderPhone || "",
  ).replace(/\D/g, "");

  return tickets
    .map((ticket) => {
      const ticketText = getTicketText(ticket);
      let score = 0;
      const reasons = [];

      [
        references.transactionId,
        references.voucherId,
        references.retailerId,
      ]
        .filter(Boolean)
        .forEach((reference) => {
          if (
            ticketText.includes(
              normalizeText(reference),
            )
          ) {
            score += 10;
            reasons.push(reference);
          }
        });

      const ticketCustomerName =
        normalizeText(
          getTicketCustomerName(ticket),
        );

      if (
        senderName &&
        ticketCustomerName &&
        (ticketCustomerName.includes(senderName) ||
          senderName.includes(ticketCustomerName))
      ) {
        score += 4;
        reasons.push("same customer");
      }

      const ticketPhone = String(
        getTicketCustomerPhone(ticket),
      ).replace(/\D/g, "");

      if (
        senderPhone.length >= 7 &&
        ticketPhone.length >= 7 &&
        (senderPhone.endsWith(ticketPhone) ||
          ticketPhone.endsWith(senderPhone))
      ) {
        score += 6;
        reasons.push("same phone");
      }

      const matchingWords =
        messageWords.filter((word) =>
          ticketText.includes(word),
        );

      if (matchingWords.length > 0) {
        score += Math.min(
          matchingWords.length,
          4,
        );

        reasons.push(
          `${Math.min(
            matchingWords.length,
            4,
          )} matching terms`,
        );
      }

      const ticketStatus = normalizeText(
        ticket.status,
      );

      if (
        ticketStatus &&
        !["closed", "irrelevant"].includes(
          ticketStatus,
        )
      ) {
        score += 1;
      }

      return {
        ...ticket,
        matchScore: score,
        matchReasons: reasons,
      };
    })
    .filter((ticket) => ticket.matchScore > 0)
    .sort(
      (first, second) =>
        second.matchScore - first.matchScore,
    );
};

const isReviewableMessage = (message) => {
  if (!message || message.direction !== "inbound") {
    return false;
  }

  return [
    "unreviewed",
    "awaiting_information",
  ].includes(message.reviewStatus);
};

const conversationMatchesView = (
  conversation,
  view,
) => {
  if (view === VIEW_ALL) {
    return true;
  }

  const statuses = (
    conversation.messages || []
  ).map((message) => message.reviewStatus);

  if (view === VIEW_REVIEW) {
    return statuses.some((status) =>
      [
        "unreviewed",
        "awaiting_information",
      ].includes(status),
    );
  }

  if (view === VIEW_TICKETED) {
    return statuses.some((status) =>
      ["ticket_created", "linked"].includes(
        status,
      ),
    );
  }

  return statuses.includes("no_ticket");
};

function DecisionModal({
  type,
  message,
  conversation,
  tickets,
  onClose,
  onCreate,
  onLink,
}) {
  const reference = extractReference(
    message?.body,
  );

  const [form, setForm] = useState({
    subject: createSubject(message?.body),
    description: message?.body || "",
    category: suggestCategory(message?.body),
    priority: suggestPriority(message?.body),
    senderName: message?.senderName || "",
    senderRole: message?.senderRole || "",
    senderPhone: message?.senderPhone || "",
    transactionId: reference.transactionId,
    voucherId: reference.voucherId,
    retailerId: reference.retailerId,
  });

  const [ticketSearch, setTicketSearch] =
    useState("");

  const filteredTickets = useMemo(() => {
    const query = normalizeText(ticketSearch);

    if (!query) {
      return tickets;
    }

    return tickets.filter((ticket) =>
      getTicketText(ticket).includes(query),
    );
  }, [ticketSearch, tickets]);

  const recommendedTickets = useMemo(
    () =>
      rankRelatedTickets(
        message,
        tickets,
      ).slice(0, 3),
    [message, tickets],
  );

  useEffect(() => {
    if (!type) {
      return undefined;
    }

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      closeOnEscape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        closeOnEscape,
      );
    };
  }, [type, onClose]);

  if (!type || !message) {
    return null;
  }

  return (
    <div
      className="wa-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="wa-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wa-decision-title"
      >
        <header className="wa-modal-header">
          <div>
            <span>WhatsApp triage</span>

            <h2 id="wa-decision-title">
              {type === "create"
                ? "Create ticket"
                : "Link to an existing ticket"}
            </h2>

            <p>
              {message.senderName} ·{" "}
              {formatTime(message.createdAt)}
            </p>
          </div>

          <button
            type="button"
            className="wa-icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </header>

        <div className="wa-modal-message">
          {message.body}
        </div>

        {type === "create" ? (
          <form
            className="wa-ticket-form"
            onSubmit={(event) => {
              event.preventDefault();
              onCreate(form);
            }}
          >
            <div className="wa-form-field full">
              <label htmlFor="wa-ticket-subject">
                Subject
              </label>

              <input
                id="wa-ticket-subject"
                value={form.subject}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    subject: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="wa-form-field">
              <label htmlFor="wa-ticket-category">
                Category
              </label>

              <select
                id="wa-ticket-category"
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
              >
                <option>
                  Payment / Settlement
                </option>
                <option>Voucher Issue</option>
                <option>Account / KYC</option>
                <option>
                  Technical Problem
                </option>
                <option>
                  General Complaint
                </option>
              </select>
            </div>

            <div className="wa-form-field">
              <label htmlFor="wa-ticket-priority">
                Priority
              </label>

              <select
                id="wa-ticket-priority"
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priority: event.target.value,
                  }))
                }
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>

            <div className="wa-form-field">
              <label htmlFor="wa-transaction-id">
                Transaction ID
              </label>

              <input
                id="wa-transaction-id"
                value={form.transactionId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    transactionId:
                      event.target.value,
                  }))
                }
                placeholder="Optional"
              />
            </div>

            <div className="wa-form-field">
              <label htmlFor="wa-retailer-id">
                Retailer ID
              </label>

              <input
                id="wa-retailer-id"
                value={form.retailerId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    retailerId:
                      event.target.value,
                  }))
                }
                placeholder="Optional"
              />
            </div>

            <div className="wa-form-field full">
              <label htmlFor="wa-ticket-description">
                Description
              </label>

              <textarea
                id="wa-ticket-description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description:
                      event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="wa-ticket-source-summary">
              <span>Source</span>

              <strong>
                WhatsApp ·{" "}
                {conversation?.type === "group"
                  ? conversation.name
                  : message.senderName}
              </strong>
            </div>

            <footer className="wa-modal-footer">
              <button
                type="button"
                className="wa-button-secondary"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="wa-button-primary"
              >
                <FaTicketAlt />
                Create Ticket
              </button>
            </footer>
          </form>
        ) : (
          <div className="wa-link-workspace">
            {recommendedTickets.length > 0 && (
              <section className="wa-modal-recommendations">
                <h3>Recommended matches</h3>

                {recommendedTickets.map(
                  (ticket) => (
                    <button
                      type="button"
                      key={`${ticket.sourceType}:${ticket.id}`}
                      className="wa-ticket-match"
                      onClick={() =>
                        onLink(ticket)
                      }
                    >
                      <span>
                        <strong>
                          {getTicketLabel(ticket)}
                        </strong>

                        <small>
                          {ticket.subject ||
                            ticket.title ||
                            "No subject"}
                        </small>
                      </span>

                      <span className="wa-match-score">
                        {ticket.matchScore}
                      </span>
                    </button>
                  ),
                )}
              </section>
            )}

            <label className="wa-modal-ticket-search">
              <FaSearch />

              <input
                type="search"
                value={ticketSearch}
                onChange={(event) =>
                  setTicketSearch(
                    event.target.value,
                  )
                }
                placeholder="Search ticket number, customer or reference"
              />
            </label>

            <div className="wa-modal-ticket-list">
              {filteredTickets.map((ticket) => (
                <button
                  type="button"
                  key={`${ticket.sourceType}:${ticket.id}`}
                  className="wa-modal-ticket-row"
                  onClick={() => onLink(ticket)}
                >
                  <span>
                    <strong>
                      {getTicketLabel(ticket)}
                    </strong>

                    <small>
                      {ticket.subject ||
                        ticket.title ||
                        "No subject"}
                    </small>
                  </span>

                  <FaArrowRight />
                </button>
              ))}

              {filteredTickets.length === 0 && (
                <div className="wa-empty-link-state">
                  No matching tickets found.
                </div>
              )}
            </div>

            <footer className="wa-modal-footer">
              <button
                type="button"
                className="wa-button-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
            </footer>
          </div>
        )}
      </section>
    </div>
  );
}

export default function WhatsAppInbox() {
  const navigate = useNavigate();

  const ticketContext = useTickets();
  const crmTickets = ticketContext?.tickets || [];

  const [conversations, setConversations] =
    useState(() =>
      readStorage(
        MOCK_WHATSAPP_STORAGE_KEY,
        createInitialMockConversations,
      ),
    );

  const [demoTickets, setDemoTickets] =
    useState(() =>
      readStorage(
        MOCK_WHATSAPP_TICKETS_KEY,
        createInitialMockTickets,
      ),
    );

  const [pendingRequests, setPendingRequests] =
    useState(() =>
      readStorage(
        MOCK_WHATSAPP_PENDING_KEY,
        () => [],
      ),
    );

  const [selectedConversationId, setSelectedConversationId] =
    useState(
      () =>
        readStorage(
          MOCK_WHATSAPP_STORAGE_KEY,
          createInitialMockConversations,
        )[0]?.id || "",
    );

  const [selectedMessageId, setSelectedMessageId] =
    useState("");

  const [activeView, setActiveView] =
    useState(VIEW_ALL);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [outgoingMessage, setOutgoingMessage] =
    useState("");

  const [decisionModal, setDecisionModal] =
    useState(null);

  const [showSimulator, setShowSimulator] =
    useState(false);

  const [showReviewPanel, setShowReviewPanel] =
    useState(true);

  const [autoAdvance, setAutoAdvance] =
    useState(true);

  const [customIncomingMessage, setCustomIncomingMessage] =
    useState(
      "#NEW_TICKET\nIssue Type: Payment Not Received\nRetailer ID: RTL-2038\nTransaction ID: TXN-84920\nAmount: 12500\nPriority: High\nDescription: Amount deducted but retailer did not receive payment.",
    );

  const [customSenderName, setCustomSenderName] =
    useState("");

  useEffect(() => {
    writeStorage(
      MOCK_WHATSAPP_STORAGE_KEY,
      conversations,
    );
  }, [conversations]);

  useEffect(() => {
    writeStorage(
      MOCK_WHATSAPP_TICKETS_KEY,
      demoTickets,
    );
  }, [demoTickets]);

  useEffect(() => {
    writeStorage(
      MOCK_WHATSAPP_PENDING_KEY,
      pendingRequests,
    );
  }, [pendingRequests]);

  const allLinkableTickets = useMemo(
    () => [
      ...demoTickets.map((ticket) => ({
        ...ticket,
        sourceType: "demo",
      })),
      ...crmTickets.map((ticket) => ({
        ...ticket,
        sourceType: "crm",
      })),
    ],
    [demoTickets, crmTickets],
  );

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) =>
          conversation.id ===
          selectedConversationId,
      ) || conversations[0] || null,
    [conversations, selectedConversationId],
  );

  const selectedMessage = useMemo(
    () =>
      selectedConversation?.messages.find(
        (message) =>
          message.id === selectedMessageId,
      ) || null,
    [selectedConversation, selectedMessageId],
  );

  const stats = useMemo(() => {
    const allMessages = conversations.flatMap(
      (conversation) =>
        conversation.messages || [],
    );

    return {
      conversations: conversations.length,
      review: allMessages.filter(
        isReviewableMessage,
      ).length,
      ticketed: allMessages.filter(
        (message) =>
          message.reviewStatus ===
            "ticket_created" ||
          message.reviewStatus === "linked",
      ).length,
      ignored: allMessages.filter(
        (message) =>
          message.reviewStatus ===
          "no_ticket",
      ).length,
    };
  }, [conversations]);

  const viewCounts = useMemo(
    () => ({
      all: conversations.length,
      review: conversations.filter(
        (conversation) =>
          conversationMatchesView(
            conversation,
            VIEW_REVIEW,
          ),
      ).length,
      ticketed: conversations.filter(
        (conversation) =>
          conversationMatchesView(
            conversation,
            VIEW_TICKETED,
          ),
      ).length,
      ignored: conversations.filter(
        (conversation) =>
          conversationMatchesView(
            conversation,
            VIEW_IGNORED,
          ),
      ).length,
    }),
    [conversations],
  );

  const filteredConversations = useMemo(() => {
    const query = normalizeText(searchTerm);

    return conversations.filter(
      (conversation) => {
        const matchesView =
          conversationMatchesView(
            conversation,
            activeView,
          );

        if (!matchesView) {
          return false;
        }

        if (!query) {
          return true;
        }

        return [
          conversation.name,
          conversation.contactPhone,
          ...(conversation.participants || []).map(
            (participant) =>
              `${participant.name} ${participant.role}`,
          ),
          ...(conversation.messages || []).map(
            (message) => message.body,
          ),
        ].some((value) =>
          normalizeText(value).includes(query),
        );
      },
    );
  }, [
    conversations,
    searchTerm,
    activeView,
  ]);

  const relatedTickets = useMemo(
    () =>
      rankRelatedTickets(
        selectedMessage,
        allLinkableTickets,
      ).slice(0, 4),
    [selectedMessage, allLinkableTickets],
  );

  const pendingForConversation = useMemo(
    () =>
      pendingRequests.filter(
        (request) =>
          request.conversationId ===
            selectedConversation?.id &&
          request.status ===
            "awaiting_information",
      ),
    [pendingRequests, selectedConversation],
  );

  const updateMessage = (
    conversationId,
    messageId,
    updates,
  ) => {
    setConversations((current) =>
      current.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation;
        }

        return {
          ...conversation,
          messages: conversation.messages.map(
            (message) =>
              message.id === messageId
                ? {
                    ...message,
                    ...updates,
                  }
                : message,
          ),
        };
      }),
    );
  };

  const getFirstReviewableMessage = (
    conversation,
  ) => {
    return (
      conversation?.messages.find(
        isReviewableMessage,
      ) || null
    );
  };

  const selectConversation = (
    conversationId,
    preferredMessageId = "",
  ) => {
    const conversation =
      conversations.find(
        (item) => item.id === conversationId,
      );

    const nextMessageId =
      preferredMessageId ||
      getFirstReviewableMessage(
        conversation,
      )?.id ||
      "";

    setSelectedConversationId(conversationId);
    setSelectedMessageId(nextMessageId);

    setConversations((current) =>
      current.map((item) =>
        item.id === conversationId
          ? {
              ...item,
              unreadCount: 0,
            }
          : item,
      ),
    );
  };

  const findNextReviewTarget = (
    excludedConversationId = "",
    excludedMessageId = "",
  ) => {
    for (const conversation of conversations) {
      for (const message of conversation.messages || []) {
        if (
          conversation.id ===
            excludedConversationId &&
          message.id === excludedMessageId
        ) {
          continue;
        }

        if (isReviewableMessage(message)) {
          return {
            conversationId: conversation.id,
            messageId: message.id,
          };
        }
      }
    }

    return null;
  };

  const selectNextReview = (
    excludedConversationId =
      selectedConversation?.id || "",
    excludedMessageId =
      selectedMessage?.id || "",
  ) => {
    const target = findNextReviewTarget(
      excludedConversationId,
      excludedMessageId,
    );

    if (!target) {
      setSelectedMessageId("");
      return;
    }

    setActiveView(VIEW_REVIEW);
    setShowReviewPanel(true);

    selectConversation(
      target.conversationId,
      target.messageId,
    );
  };

  const moveConversation = (direction) => {
    if (filteredConversations.length === 0) {
      return;
    }

    const currentIndex =
      filteredConversations.findIndex(
        (conversation) =>
          conversation.id ===
          selectedConversationId,
      );

    const safeCurrentIndex =
      currentIndex >= 0 ? currentIndex : 0;

    const nextIndex =
      (safeCurrentIndex +
        direction +
        filteredConversations.length) %
      filteredConversations.length;

    selectConversation(
      filteredConversations[nextIndex].id,
    );
  };

  useEffect(() => {
    if (filteredConversations.length === 0) {
      return;
    }

    const currentConversationIsVisible =
      filteredConversations.some(
        (conversation) =>
          conversation.id ===
          selectedConversationId,
      );

    if (!currentConversationIsVisible) {
      selectConversation(
        filteredConversations[0].id,
      );
    }
  }, [
    activeView,
    searchTerm,
    filteredConversations,
    selectedConversationId,
  ]);

  useEffect(() => {
    const handleKeyboardShortcuts = (
      event,
    ) => {
      const activeElement =
        document.activeElement;

      const isTyping =
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          activeElement?.tagName,
        ) ||
        activeElement?.isContentEditable;

      if (isTyping) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "j") {
        event.preventDefault();
        moveConversation(1);
      }

      if (key === "k") {
        event.preventDefault();
        moveConversation(-1);
      }

      if (key === "n") {
        event.preventDefault();
        selectNextReview();
      }

      if (event.key === "Escape") {
        setSelectedMessageId("");
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyboardShortcuts,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyboardShortcuts,
      );
    };
  });

  const completeDecision = (
    conversationId,
    messageId,
  ) => {
    if (autoAdvance) {
      window.setTimeout(() => {
        selectNextReview(
          conversationId,
          messageId,
        );
      }, 0);
    }
  };

  const markNoTicket = () => {
    if (
      !selectedConversation ||
      !selectedMessage
    ) {
      return;
    }

    updateMessage(
      selectedConversation.id,
      selectedMessage.id,
      {
        reviewStatus: "no_ticket",
        linkedTicketId: "",
        linkedTicketNumber: "",
        linkedTicketSource: "",
        decisionNote:
          "Marked as normal conversation with no support ticket required.",
      },
    );

    completeDecision(
      selectedConversation.id,
      selectedMessage.id,
    );
  };

  const createDemoTicket = (form) => {
    if (
      !selectedConversation ||
      !selectedMessage
    ) {
      return;
    }

    const ticket = {
      id: `demo-ticket-${Date.now()}`,
      ticketNumber:
        getNextDemoTicketNumber(),
      subject: form.subject,
      description: form.description,
      category: form.category,
      priority: form.priority,
      status: "Open",
      source: "WhatsApp",
      sourceType:
        selectedConversation.type,
      conversationId:
        selectedConversation.id,
      conversationName:
        selectedConversation.name,
      whatsappGroupId:
        selectedConversation.groupId || "",
      senderName: form.senderName,
      senderRole: form.senderRole,
      senderPhone: form.senderPhone,
      transactionId:
        form.transactionId || "",
      voucherId: form.voucherId || "",
      retailerId: form.retailerId || "",
      sourceMessageId: selectedMessage.id,
      createdAt: new Date().toISOString(),
    };

    setDemoTickets((current) => [
      ticket,
      ...current,
    ]);

    updateMessage(
      selectedConversation.id,
      selectedMessage.id,
      {
        reviewStatus: "ticket_created",
        linkedTicketId: ticket.id,
        linkedTicketNumber:
          ticket.ticketNumber,
        linkedTicketSource: "demo",
        decisionNote:
          "A local ticket was created from this WhatsApp message.",
      },
    );

    setDecisionModal(null);

    completeDecision(
      selectedConversation.id,
      selectedMessage.id,
    );
  };

  const linkMessageToTicket = (ticket) => {
    if (
      !selectedConversation ||
      !selectedMessage ||
      !ticket
    ) {
      return;
    }

    updateMessage(
      selectedConversation.id,
      selectedMessage.id,
      {
        reviewStatus: "linked",
        linkedTicketId: ticket.id,
        linkedTicketNumber:
          getTicketLabel(ticket),
        linkedTicketSource:
          ticket.sourceType || "crm",
        decisionNote:
          "This WhatsApp message was linked to an existing ticket.",
      },
    );

    setDecisionModal(null);

    completeDecision(
      selectedConversation.id,
      selectedMessage.id,
    );
  };

  const undoDecision = () => {
    if (
      !selectedConversation ||
      !selectedMessage
    ) {
      return;
    }

    updateMessage(
      selectedConversation.id,
      selectedMessage.id,
      {
        reviewStatus: "unreviewed",
        linkedTicketId: "",
        linkedTicketNumber: "",
        linkedTicketSource: "",
        decisionNote: "",
      },
    );
  };

  const sendMockReply = (event) => {
    event.preventDefault();

    const body = outgoingMessage.trim();

    if (!body || !selectedConversation) {
      return;
    }

    const message = {
      id: `outgoing-${Date.now()}`,
      senderName: "ServiceWise Support",
      senderRole: "Support",
      senderPhone:
        selectedConversation.businessNumber,
      direction: "outbound",
      body,
      createdAt: new Date().toISOString(),
      reviewStatus: "conversation_only",
      deliveryStatus: "Mock saved",
    };

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id ===
        selectedConversation.id
          ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                message,
              ],
              lastMessageAt:
                message.createdAt,
            }
          : conversation,
      ),
    );

    setOutgoingMessage("");
  };

  const insertSavedReply = (replyId) => {
    const reply = SAVED_REPLIES.find(
      (item) => item.id === replyId,
    );

    if (!reply) {
      return;
    }

    setOutgoingMessage((current) =>
      current.trim()
        ? `${current.trim()}\n\n${reply.text}`
        : reply.text,
    );
  };

  const simulateIncomingMessage = () => {
    if (!selectedConversation) {
      return;
    }

    const scenario =
      mockIncomingScenarios[
        Math.floor(
          Math.random() *
            mockIncomingScenarios.length,
        )
      ];

    const possibleSenders =
      selectedConversation.participants.filter(
        (participant) =>
          participant.role !== "Support",
      );

    const sender =
      possibleSenders[
        Math.floor(
          Math.random() *
            possibleSenders.length,
        )
      ] ||
      selectedConversation.participants[0];

    const message = {
      id: `incoming-${Date.now()}`,
      senderName: sender?.name || "Customer",
      senderRole:
        scenario.senderRole ||
        sender?.role ||
        "Customer",
      senderPhone: sender?.phone || "",
      direction: "inbound",
      body: scenario.body,
      createdAt: new Date().toISOString(),
      reviewStatus: "unreviewed",
    };

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id ===
        selectedConversation.id
          ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                message,
              ],
              unreadCount:
                (conversation.unreadCount || 0) + 1,
              lastMessageAt:
                message.createdAt,
            }
          : conversation,
      ),
    );

    setSelectedMessageId(message.id);
    setActiveView(VIEW_REVIEW);
  };

  const getNextDemoTicketNumber = () => {
    const nextNumber =
      demoTickets.reduce((highest, ticket) => {
        const number = Number(
          String(
            ticket.ticketNumber || "",
          ).replace(/\D/g, ""),
        );

        return Number.isNaN(number)
          ? highest
          : Math.max(highest, number);
      }, 0) + 1;

    return `TKT-WA-${String(
      nextNumber,
    ).padStart(3, "0")}`;
  };

  const createAutomaticTicket = ({
    conversation,
    message,
    fields,
  }) => {
    const ticketNumber =
      getNextDemoTicketNumber();

    const ticket = {
      id: `demo-ticket-${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`,
      ticketNumber,
      subject: `${fields.issueType || "WhatsApp complaint"}${
        fields.transactionId
          ? ` — ${fields.transactionId}`
          : fields.voucherId
            ? ` — ${fields.voucherId}`
            : ""
      }`,
      description:
        fields.description || message.body,
      category:
        fields.issueType || "General Complaint",
      priority: fields.priority || "Medium",
      status: "Open",
      source: "WhatsApp",
      sourceType: conversation.type,
      conversationId: conversation.id,
      conversationName: conversation.name,
      whatsappGroupId:
        conversation.groupId || "",
      senderName: message.senderName,
      senderRole: message.senderRole,
      senderPhone: message.senderPhone,
      transactionId:
        fields.transactionId || "",
      voucherId: fields.voucherId || "",
      retailerId: fields.retailerId || "",
      amount: fields.amount || "",
      registeredPhone:
        fields.registeredPhone || "",
      sourceMessageId: message.id,
      createdAt: new Date().toISOString(),
    };

    setDemoTickets((current) => [
      ticket,
      ...current,
    ]);

    return ticket;
  };

  const appendProcessedMessages = (
    conversationId,
    messages,
  ) => {
    const lastMessage =
      messages[messages.length - 1];

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: [
                ...conversation.messages,
                ...messages,
              ],
              lastMessageAt:
                lastMessage?.createdAt ||
                conversation.lastMessageAt,
            }
          : conversation,
      ),
    );
  };

  const createAutoReply = (body) => ({
    id: `auto-reply-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`,
    senderName: "ServiceWise Auto Assistant",
    senderRole: "Support",
    senderPhone:
      selectedConversation?.businessNumber ||
      "",
    direction: "outbound",
    body,
    createdAt: new Date().toISOString(),
    reviewStatus: "conversation_only",
    deliveryStatus: "Mock auto reply",
    isAutomatic: true,
  });

  const processCustomIncomingMessage = (
    event,
  ) => {
    event.preventDefault();

    const body = customIncomingMessage.trim();

    if (!body || !selectedConversation) {
      return;
    }

    const parsed =
      parseStructuredWhatsAppMessage(body);

    const possibleSenders =
      selectedConversation.participants.filter(
        (participant) =>
          participant.role !== "Support",
      );

    const matchingSender =
      possibleSenders.find(
        (participant) =>
          participant.name.toLowerCase() ===
          customSenderName
            .trim()
            .toLowerCase(),
      ) || possibleSenders[0];

    const inboundMessage = {
      id: `custom-incoming-${Date.now()}`,
      senderName:
        customSenderName.trim() ||
        matchingSender?.name ||
        "Customer",
      senderRole:
        matchingSender?.role || "Customer",
      senderPhone:
        matchingSender?.phone || "",
      direction: "inbound",
      body,
      createdAt: new Date().toISOString(),
      reviewStatus: "unreviewed",
    };

    const messagesToAppend = [
      inboundMessage,
    ];

    if (parsed.type === "new_ticket") {
      const missingFields =
        getMissingFields(parsed.fields);

      if (missingFields.length > 0) {
        const reference =
          createPendingReference(
            pendingRequests,
          );

        inboundMessage.reviewStatus =
          "awaiting_information";
        inboundMessage.pendingReference =
          reference;
        inboundMessage.decisionNote =
          `Waiting for ${missingFields.length} missing field(s).`;

        setPendingRequests((current) => [
          {
            reference,
            conversationId:
              selectedConversation.id,
            senderName:
              inboundMessage.senderName,
            senderPhone:
              inboundMessage.senderPhone,
            originalMessageId:
              inboundMessage.id,
            fields: parsed.fields,
            missingFields,
            status:
              "awaiting_information",
            createdAt:
              inboundMessage.createdAt,
          },
          ...current,
        ]);

        messagesToAppend.push(
          createAutoReply(
            buildMissingDetailsReply({
              reference,
              fields: parsed.fields,
              missingFields,
            }),
          ),
        );
      } else {
        const ticket =
          createAutomaticTicket({
            conversation:
              selectedConversation,
            message: inboundMessage,
            fields: parsed.fields,
          });

        inboundMessage.reviewStatus =
          "ticket_created";
        inboundMessage.linkedTicketId =
          ticket.id;
        inboundMessage.linkedTicketNumber =
          ticket.ticketNumber;
        inboundMessage.linkedTicketSource =
          "demo";
        inboundMessage.decisionNote =
          "Ticket automatically created from a valid formatted message.";

        messagesToAppend.push(
          createAutoReply(
            [
              `Ticket ${ticket.ticketNumber} has been created successfully.`,
              "",
              `Issue: ${ticket.category}`,
              ticket.retailerId
                ? `Retailer ID: ${ticket.retailerId}`
                : "",
              ticket.transactionId
                ? `Transaction ID: ${ticket.transactionId}`
                : "",
              ticket.voucherId
                ? `Voucher ID: ${ticket.voucherId}`
                : "",
              `Status: ${ticket.status}`,
            ]
              .filter(Boolean)
              .join("\n"),
          ),
        );
      }
    }

    if (parsed.type === "complete") {
      const pendingRequest =
        pendingRequests.find(
          (request) =>
            request.reference ===
              parsed.reference &&
            request.conversationId ===
              selectedConversation.id,
        );

      if (!pendingRequest) {
        messagesToAppend.push(
          createAutoReply(
            `Request ${parsed.reference} was not found. Please check the reference or submit a new #NEW_TICKET message.`,
          ),
        );
      } else {
        const mergedFields = {
          ...pendingRequest.fields,
          ...parsed.fields,
        };

        const missingFields =
          getMissingFields(mergedFields);

        inboundMessage.pendingReference =
          pendingRequest.reference;

        if (missingFields.length > 0) {
          inboundMessage.reviewStatus =
            "awaiting_information";
          inboundMessage.decisionNote =
            `Still waiting for ${missingFields.length} field(s).`;

          setPendingRequests((current) =>
            current.map((request) =>
              request.reference ===
              pendingRequest.reference
                ? {
                    ...request,
                    fields: mergedFields,
                    missingFields,
                    updatedAt:
                      new Date().toISOString(),
                  }
                : request,
            ),
          );

          messagesToAppend.push(
            createAutoReply(
              buildMissingDetailsReply({
                reference:
                  pendingRequest.reference,
                fields: mergedFields,
                missingFields,
              }),
            ),
          );
        } else {
          const ticket =
            createAutomaticTicket({
              conversation:
                selectedConversation,
              message: inboundMessage,
              fields: mergedFields,
            });

          inboundMessage.reviewStatus =
            "ticket_created";
          inboundMessage.linkedTicketId =
            ticket.id;
          inboundMessage.linkedTicketNumber =
            ticket.ticketNumber;
          inboundMessage.linkedTicketSource =
            "demo";
          inboundMessage.decisionNote =
            `Missing information completed for ${pendingRequest.reference}.`;

          setPendingRequests((current) =>
            current.map((request) =>
              request.reference ===
              pendingRequest.reference
                ? {
                    ...request,
                    fields: mergedFields,
                    missingFields: [],
                    status: "ticket_created",
                    ticketId: ticket.id,
                    ticketNumber:
                      ticket.ticketNumber,
                    completedAt:
                      new Date().toISOString(),
                  }
                : request,
            ),
          );

          messagesToAppend.push(
            createAutoReply(
              `Thank you. All required information was received and ticket ${ticket.ticketNumber} has been created.`,
            ),
          );
        }
      }
    }

    if (parsed.type === "update") {
      const linkedTicket =
        allLinkableTickets.find(
          (ticket) =>
            normalizeText(
              getTicketLabel(ticket),
            ) ===
            normalizeText(
              parsed.reference,
            ),
        );

      if (linkedTicket) {
        inboundMessage.reviewStatus =
          "linked";
        inboundMessage.linkedTicketId =
          linkedTicket.id;
        inboundMessage.linkedTicketNumber =
          getTicketLabel(linkedTicket);
        inboundMessage.linkedTicketSource =
          linkedTicket.sourceType;
        inboundMessage.decisionNote =
          "Formatted update automatically linked to the existing ticket.";

        messagesToAppend.push(
          createAutoReply(
            `Your update has been added to ticket ${getTicketLabel(
              linkedTicket,
            )}.`,
          ),
        );
      } else {
        inboundMessage.reviewStatus =
          "unreviewed";
        inboundMessage.decisionNote =
          "Referenced ticket was not found.";

        messagesToAppend.push(
          createAutoReply(
            `Ticket ${parsed.reference} was not found. A support agent can create a new ticket, link this message manually, or ignore it.`,
          ),
        );
      }
    }

    appendProcessedMessages(
      selectedConversation.id,
      messagesToAppend,
    );

    setSelectedMessageId(
      inboundMessage.id,
    );

    setActiveView(
      isReviewableMessage(inboundMessage)
        ? VIEW_REVIEW
        : VIEW_ALL,
    );
  };

  const setFormattedExample = (type) => {
    if (type === "complete") {
      setCustomIncomingMessage(
        "#NEW_TICKET\nIssue Type: Payment Not Received\nRetailer ID: RTL-2038\nTransaction ID: TXN-84920\nAmount: 12500\nPriority: High\nDescription: Amount deducted but retailer did not receive payment.",
      );
      return;
    }

    if (type === "incomplete") {
      setCustomIncomingMessage(
        "#NEW_TICKET\nIssue Type: Payment Not Received\nRetailer ID: RTL-2038\nDescription: Amount deducted but retailer did not receive payment.",
      );
      return;
    }

    if (type === "complete_missing") {
      const latestPending =
        pendingRequests.find(
          (request) =>
            request.status ===
              "awaiting_information" &&
            request.conversationId ===
              selectedConversation?.id,
        );

      const reference =
        latestPending?.reference ||
        "WA-REQ-1001";

      setCustomIncomingMessage(
        `#COMPLETE ${reference}\nTransaction ID: TXN-84920\nAmount: 12500`,
      );
      return;
    }

    if (type === "update") {
      const ticketNumber =
        demoTickets[0]?.ticketNumber ||
        "TKT-WA-001";

      setCustomIncomingMessage(
        `#UPDATE ${ticketNumber}\nPayment is still pending today. Please check.`,
      );
      return;
    }

    setCustomIncomingMessage(
      "Good morning team. Please share today's settlement report.",
    );
  };

  const resetDemo = () => {
    const resetConversations =
      createInitialMockConversations();

    const resetTickets =
      createInitialMockTickets();

    setConversations(resetConversations);
    setDemoTickets(resetTickets);
    setPendingRequests([]);
    setSelectedConversationId(
      resetConversations[0]?.id || "",
    );
    setSelectedMessageId("");
    setActiveView(VIEW_ALL);
    setSearchTerm("");
    setOutgoingMessage("");
    setShowSimulator(false);
    setCustomSenderName("");
    setCustomIncomingMessage(
      "#NEW_TICKET\nIssue Type: Payment Not Received\nRetailer ID: RTL-2038\nTransaction ID: TXN-84920\nAmount: 12500\nPriority: High\nDescription: Amount deducted but retailer did not receive payment.",
    );

    writeStorage(
      MOCK_WHATSAPP_STORAGE_KEY,
      resetConversations,
    );

    writeStorage(
      MOCK_WHATSAPP_TICKETS_KEY,
      resetTickets,
    );

    writeStorage(
      MOCK_WHATSAPP_PENDING_KEY,
      [],
    );
  };

  const openLinkedTicket = (
    message = selectedMessage,
  ) => {
    if (
      !message?.linkedTicketId ||
      message.linkedTicketSource !== "crm"
    ) {
      return;
    }

    navigate(
      `/tickets/${encodeURIComponent(
        String(message.linkedTicketId),
      )}`,
    );
  };

  const viewTabs = [
    {
      key: VIEW_ALL,
      label: "Inbox",
      count: viewCounts.all,
    },
    {
      key: VIEW_REVIEW,
      label: "Needs review",
      count: viewCounts.review,
    },
    {
      key: VIEW_TICKETED,
      label: "Ticketed",
      count: viewCounts.ticketed,
    },
    {
      key: VIEW_IGNORED,
      label: "Ignored",
      count: viewCounts.ignored,
    },
  ];

  const selectedReferences =
    extractReference(selectedMessage?.body);

  return (
    <div className="wa-inbox-page">
      <header className="wa-page-toolbar">
        <div className="wa-page-title">
          <span className="wa-page-icon">
            <FaWhatsapp />
          </span>

          <div>
            <div className="wa-page-title-line">
              <h1>WhatsApp Inbox</h1>

              <span className="wa-mode-badge">
                Mock mode
              </span>
            </div>

            <p>
              Review conversations and turn the
              right messages into support tickets.
            </p>
          </div>
        </div>

        <div className="wa-page-actions">
          <span className="wa-review-summary">
            <strong>{stats.review}</strong>
            need review
          </span>

          <button
            type="button"
            className={`wa-button-secondary wa-review-panel-toggle ${
              showReviewPanel
                ? "is-open"
                : ""
            }`}
            onClick={() =>
              setShowReviewPanel(
                (current) => !current,
              )
            }
            aria-expanded={showReviewPanel}
            title={
              showReviewPanel
                ? "Hide review panel"
                : "Show review panel"
            }
          >
            {showReviewPanel ? (
              <FaEyeSlash />
            ) : (
              <FaEye />
            )}

            {showReviewPanel
              ? "Hide review"
              : "Show review"}
          </button>

          <button
            type="button"
            className="wa-button-secondary"
            onClick={() =>
              setShowSimulator(
                (current) => !current,
              )
            }
          >
            <FaBolt />
            Test message
            <FaChevronDown
              className={
                showSimulator
                  ? "rotated"
                  : ""
              }
            />
          </button>

          <button
            type="button"
            className="wa-button-primary"
            onClick={() => selectNextReview()}
            disabled={stats.review === 0}
          >
            Review next
            <FaArrowRight />
          </button>

          <button
            type="button"
            className="wa-icon-button"
            onClick={resetDemo}
            title="Reset mock data"
            aria-label="Reset mock data"
          >
            <FaRedoAlt />
          </button>
        </div>
      </header>

      {showSimulator && (
        <section className="wa-simulator-drawer">
          <div className="wa-simulator-drawer-heading">
            <div>
              <strong>
                Local message simulator
              </strong>

              <span>
                Test formatted and normal WhatsApp
                messages without an API.
              </span>
            </div>

            <button
              type="button"
              className="wa-icon-button"
              onClick={() =>
                setShowSimulator(false)
              }
              aria-label="Close simulator"
            >
              <FaTimes />
            </button>
          </div>

          <div className="wa-example-buttons">
            <button
              type="button"
              onClick={() =>
                setFormattedExample("complete")
              }
            >
              Complete ticket
            </button>

            <button
              type="button"
              onClick={() =>
                setFormattedExample("incomplete")
              }
            >
              Missing details
            </button>

            <button
              type="button"
              onClick={() =>
                setFormattedExample(
                  "complete_missing",
                )
              }
            >
              Complete request
            </button>

            <button
              type="button"
              onClick={() =>
                setFormattedExample("update")
              }
            >
              Ticket update
            </button>

            <button
              type="button"
              onClick={() =>
                setFormattedExample("normal")
              }
            >
              Normal message
            </button>
          </div>

          <form
            className="wa-simulator-form"
            onSubmit={
              processCustomIncomingMessage
            }
          >
            <input
              type="text"
              value={customSenderName}
              onChange={(event) =>
                setCustomSenderName(
                  event.target.value,
                )
              }
              placeholder="Sender name (optional)"
            />

            <textarea
              value={customIncomingMessage}
              onChange={(event) =>
                setCustomIncomingMessage(
                  event.target.value,
                )
              }
              placeholder="Type or paste a WhatsApp message"
            />

            <button
              type="submit"
              className="wa-button-primary"
              disabled={
                !customIncomingMessage.trim()
              }
            >
              <FaPaperPlane />
              Receive and process
            </button>
          </form>
        </section>
      )}

      <main
        className={`wa-workspace ${
          showReviewPanel
            ? ""
            : "review-hidden"
        }`}
      >
        <aside className="wa-conversation-panel">
          <div className="wa-sidebar-heading">
            <div>
              <FaInbox />
              <strong>Conversations</strong>
            </div>

            <span>{stats.conversations}</span>
          </div>

          <nav
            className="wa-view-tabs"
            aria-label="Conversation views"
          >
            {viewTabs.map((tab) => (
              <button
                type="button"
                key={tab.key}
                className={
                  activeView === tab.key
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setActiveView(tab.key);
                  setSelectedMessageId("");
                }}
              >
                <span>{tab.label}</span>
                <strong>{tab.count}</strong>
              </button>
            ))}
          </nav>

          <label className="wa-search-box">
            <FaSearch />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value,
                )
              }
              placeholder="Search conversations"
            />
          </label>

          <div className="wa-conversation-list">
            {filteredConversations.map(
              (conversation) => {
                const messages =
                  conversation.messages || [];

                const latestMessage =
                  messages[messages.length - 1];

                const reviewCount =
                  messages.filter(
                    isReviewableMessage,
                  ).length;

                return (
                  <button
                    type="button"
                    key={conversation.id}
                    className={`wa-conversation-card ${
                      conversation.id ===
                      selectedConversation?.id
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      selectConversation(
                        conversation.id,
                      )
                    }
                  >
                    <span className="wa-avatar">
                      {conversation.type ===
                      "group" ? (
                        <FaUsers />
                      ) : (
                        getInitials(
                          conversation.name,
                        )
                      )}
                    </span>

                    <span className="wa-conversation-copy">
                      <span className="wa-conversation-title">
                        <strong>
                          {conversation.name}
                        </strong>

                        <time>
                          {formatTime(
                            conversation.lastMessageAt,
                          )}
                        </time>
                      </span>

                      <span className="wa-conversation-preview">
                        {getMessagePreview(
                          latestMessage?.body,
                        )}
                      </span>

                      <span className="wa-conversation-meta">
                        {conversation.type ===
                        "group"
                          ? `${conversation.participants.length} participants`
                          : conversation.contactPhone}

                        {reviewCount > 0 && (
                          <em>
                            {reviewCount} to review
                          </em>
                        )}
                      </span>
                    </span>

                    {conversation.unreadCount > 0 && (
                      <span className="wa-unread-count">
                        {
                          conversation.unreadCount
                        }
                      </span>
                    )}
                  </button>
                );
              },
            )}

            {filteredConversations.length ===
              0 && (
              <div className="wa-empty-list">
                <FaComments />
                <strong>
                  No conversations found
                </strong>
                <span>
                  Change the view or search term.
                </span>
              </div>
            )}
          </div>

          <footer className="wa-shortcuts">
            <FaKeyboard />
            <span>
              J/K chats · N next review · Esc clear
            </span>
          </footer>
        </aside>

        <section className="wa-chat-panel">
          {selectedConversation ? (
            <>
              <header className="wa-chat-header">
                <div className="wa-chat-identity">
                  <span className="wa-avatar large">
                    {selectedConversation.type ===
                    "group" ? (
                      <FaUsers />
                    ) : (
                      getInitials(
                        selectedConversation.name,
                      )
                    )}
                  </span>

                  <div>
                    <h2>
                      {selectedConversation.name}
                    </h2>

                    <p>
                      {selectedConversation.type ===
                      "group"
                        ? `WhatsApp group · ${selectedConversation.participants.length} participants`
                        : `Direct chat · ${selectedConversation.contactPhone}`}
                    </p>
                  </div>
                </div>

                <div className="wa-chat-header-actions">
                  {pendingForConversation.length >
                    0 && (
                    <span className="wa-pending-badge">
                      {
                        pendingForConversation.length
                      }{" "}
                      waiting for details
                    </span>
                  )}

                  <button
                    type="button"
                    className="wa-button-secondary compact"
                    onClick={
                      simulateIncomingMessage
                    }
                  >
                    <FaPlus />
                    Simulate
                  </button>
                </div>
              </header>

              <div className="wa-message-list">
                {(selectedConversation.messages ||
                  []).map((message) => (
                  <button
                    type="button"
                    key={message.id}
                    className={`wa-message-bubble ${
                      message.direction ===
                      "outbound"
                        ? "outbound"
                        : "inbound"
                    } ${
                      selectedMessage?.id ===
                      message.id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedMessageId(
                        message.id,
                      )
                    }
                  >
                    <span className="wa-message-meta">
                      <strong>
                        {message.senderName}
                      </strong>

                      <span>
                        {message.senderRole}
                      </span>

                      <time>
                        {formatTime(
                          message.createdAt,
                        )}
                      </time>
                    </span>

                    <span className="wa-message-body">
                      {message.body}
                    </span>

                    <span className="wa-message-footer">
                      <span
                        className={`wa-status-text status-${message.reviewStatus}`}
                      >
                        {getReviewLabel(
                          message.reviewStatus,
                        )}
                      </span>

                      {message.linkedTicketNumber && (
                        <span className="wa-linked-ticket">
                          <FaTicketAlt />
                          {
                            message.linkedTicketNumber
                          }
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>

              <form
                className="wa-reply-composer"
                onSubmit={sendMockReply}
              >
                <div className="wa-composer-tools">
                  <label>
                    <FaBolt />

                    <select
                      defaultValue=""
                      onChange={(event) => {
                        insertSavedReply(
                          event.target.value,
                        );

                        event.target.value = "";
                      }}
                    >
                      <option value="">
                        Insert saved reply
                      </option>

                      {SAVED_REPLIES.map(
                        (reply) => (
                          <option
                            key={reply.id}
                            value={reply.id}
                          >
                            {reply.label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <span>
                    Local reply only
                  </span>
                </div>

                <div className="wa-composer-row">
                  <textarea
                    value={outgoingMessage}
                    onChange={(event) =>
                      setOutgoingMessage(
                        event.target.value,
                      )
                    }
                    placeholder="Write a support reply..."
                  />

                  <button
                    type="submit"
                    className="wa-send-button"
                    disabled={
                      !outgoingMessage.trim()
                    }
                    aria-label="Save mock reply"
                  >
                    <FaPaperPlane />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="wa-no-conversation">
              <FaWhatsapp />
              <h2>Select a conversation</h2>
              <p>
                Choose a chat from the inbox to
                read and review its messages.
              </p>
            </div>
          )}
        </section>

        {showReviewPanel && (
          <aside className="wa-context-panel">
            <div className="wa-context-heading">
            <div>
              <FaCheck />
              <strong>Review</strong>
            </div>

            <button
              type="button"
              className="wa-icon-button"
              onClick={() =>
                setShowReviewPanel(false)
              }
              aria-label="Hide review panel"
              title="Hide review panel"
            >
              <FaEyeSlash />
            </button>
          </div>

          {selectedMessage ? (
            <div className="wa-context-content">
              <section className="wa-selected-message">
                <div className="wa-selected-sender">
                  <span className="wa-avatar small">
                    <FaUser />
                  </span>

                  <div>
                    <strong>
                      {selectedMessage.senderName}
                    </strong>

                    <span>
                      {selectedMessage.senderRole}
                    </span>
                  </div>
                </div>

                <p>{selectedMessage.body}</p>

                <time>
                  {formatTime(
                    selectedMessage.createdAt,
                  )}
                </time>
              </section>

              <section className="wa-context-section">
                <div className="wa-section-heading">
                  <h3>Smart triage</h3>

                  <span>
                    Local rules
                  </span>
                </div>

                <dl className="wa-detected-grid">
                  <div>
                    <dt>Category</dt>
                    <dd>
                      {suggestCategory(
                        selectedMessage.body,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>Priority</dt>
                    <dd>
                      {suggestPriority(
                        selectedMessage.body,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>Transaction</dt>
                    <dd>
                      {selectedReferences.transactionId ||
                        "Not found"}
                    </dd>
                  </div>

                  <div>
                    <dt>Retailer</dt>
                    <dd>
                      {selectedReferences.retailerId ||
                        "Not found"}
                    </dd>
                  </div>
                </dl>
              </section>

              {relatedTickets.length > 0 && (
                <section className="wa-context-section">
                  <div className="wa-section-heading">
                    <h3>Related tickets</h3>

                    <span>
                      Smart matches
                    </span>
                  </div>

                  <div className="wa-related-ticket-list">
                    {relatedTickets.map(
                      (ticket) => (
                        <article
                          key={`${ticket.sourceType}:${ticket.id}`}
                          className="wa-related-ticket"
                        >
                          <div>
                            <strong>
                              {getTicketLabel(
                                ticket,
                              )}
                            </strong>

                            <p>
                              {ticket.subject ||
                                ticket.title ||
                                "No subject"}
                            </p>

                            <span>
                              {ticket.sourceType ===
                              "crm"
                                ? "CRM ticket"
                                : "Local ticket"}

                              {ticket.matchReasons
                                ?.length > 0
                                ? ` · ${ticket.matchReasons[0]}`
                                : ""}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              linkMessageToTicket(
                                ticket,
                              )
                            }
                            title="Link this message"
                          >
                            <FaLink />
                          </button>
                        </article>
                      ),
                    )}
                  </div>
                </section>
              )}

              {isReviewableMessage(
                selectedMessage,
              ) ? (
                <section className="wa-context-section wa-decision-actions">
                  <div className="wa-section-heading">
                    <h3>Choose an action</h3>
                  </div>

                  <button
                    type="button"
                    className="wa-action-create"
                    onClick={() =>
                      setDecisionModal("create")
                    }
                  >
                    <FaTicketAlt />

                    <span>
                      <strong>Create ticket</strong>
                      <small>
                        Start a new support case
                      </small>
                    </span>
                  </button>

                  <button
                    type="button"
                    className="wa-action-link"
                    onClick={() =>
                      setDecisionModal("link")
                    }
                  >
                    <FaLink />

                    <span>
                      <strong>Link to ticket</strong>
                      <small>
                        Add this as an update
                      </small>
                    </span>
                  </button>

                  <button
                    type="button"
                    className="wa-action-ignore"
                    onClick={markNoTicket}
                  >
                    <FaBan />

                    <span>
                      <strong>Ignore message</strong>
                      <small>
                        No support ticket needed
                      </small>
                    </span>
                  </button>

                  <label className="wa-auto-advance">
                    <input
                      type="checkbox"
                      checked={autoAdvance}
                      onChange={(event) =>
                        setAutoAdvance(
                          event.target.checked,
                        )
                      }
                    />

                    Open the next message after a
                    decision
                  </label>
                </section>
              ) : (
                <section className="wa-decision-result">
                  <span
                    className={`wa-decision-icon status-${selectedMessage.reviewStatus}`}
                  >
                    <FaCheck />
                  </span>

                  <div>
                    <span>Decision</span>

                    <strong>
                      {getReviewLabel(
                        selectedMessage.reviewStatus,
                      )}
                    </strong>

                    {selectedMessage.decisionNote && (
                      <p>
                        {
                          selectedMessage.decisionNote
                        }
                      </p>
                    )}

                    {selectedMessage.linkedTicketNumber && (
                      <span className="wa-result-ticket">
                        <FaTicketAlt />
                        {
                          selectedMessage.linkedTicketNumber
                        }
                      </span>
                    )}
                  </div>
                </section>
              )}

              {selectedMessage.linkedTicketSource ===
                "crm" && (
                <button
                  type="button"
                  className="wa-open-crm-ticket"
                  onClick={() =>
                    openLinkedTicket(
                      selectedMessage,
                    )
                  }
                >
                  Open CRM ticket
                  <FaExternalLinkAlt />
                </button>
              )}

              {!isReviewableMessage(
                selectedMessage,
              ) &&
                selectedMessage.direction ===
                  "inbound" && (
                  <button
                    type="button"
                    className="wa-undo-button"
                    onClick={undoDecision}
                  >
                    Undo decision
                  </button>
                )}
            </div>
          ) : (
            <div className="wa-context-empty">
              <span className="wa-context-empty-icon">
                <FaComments />
              </span>

              <h3>Select a message</h3>

              <p>
                Click an incoming message to create
                a ticket, link it, or ignore it.
              </p>

              {stats.review > 0 && (
                <button
                  type="button"
                  className="wa-button-primary"
                  onClick={() =>
                    selectNextReview()
                  }
                >
                  Review next message
                  <FaArrowRight />
                </button>
              )}

              {pendingRequests.filter(
                (request) =>
                  request.status ===
                  "awaiting_information",
              ).length > 0 && (
                <section className="wa-automation-queue">
                  <div className="wa-section-heading">
                    <h3>Waiting for details</h3>

                    <span>
                      {
                        pendingRequests.filter(
                          (request) =>
                            request.status ===
                            "awaiting_information",
                        ).length
                      }
                    </span>
                  </div>

                  {pendingRequests
                    .filter(
                      (request) =>
                        request.status ===
                        "awaiting_information",
                    )
                    .slice(0, 3)
                    .map((request) => (
                      <article
                        key={request.reference}
                      >
                        <strong>
                          {request.reference}
                        </strong>

                        <span>
                          Missing:{" "}
                          {request.missingFields
                            .map((field) =>
                              field
                                .replace(
                                  /([A-Z])/g,
                                  " $1",
                                )
                                .trim(),
                            )
                            .join(", ")}
                        </span>
                      </article>
                    ))}
                </section>
              )}
            </div>
          )}
          </aside>
        )}
      </main>

      <DecisionModal
        type={decisionModal}
        message={selectedMessage}
        conversation={selectedConversation}
        tickets={allLinkableTickets}
        onClose={() =>
          setDecisionModal(null)
        }
        onCreate={createDemoTicket}
        onLink={linkMessageToTicket}
      />
    </div>
  );
}
