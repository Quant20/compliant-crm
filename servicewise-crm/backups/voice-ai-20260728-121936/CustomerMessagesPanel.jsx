import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaChevronDown,
  FaChevronRight,
  FaComments,
  FaEnvelope,
  FaGlobe,
  FaPaperPlane,
  FaPhone,
  FaUsers,
  FaWhatsapp,
} from "react-icons/fa";

import "./CustomerMessagesPanel.css";

const firstValue = (...values) => {
  const value = values.find(
    (item) =>
      item !== undefined &&
      item !== null &&
      String(item).trim() !== "",
  );

  return value === undefined ? "" : value;
};

const normalizeValue = (value) =>
  String(value || "").trim().toLowerCase();

const getTicketChannel = (ticket) => {
  const rawChannel = normalizeValue(
    firstValue(
      ticket?.channel,
      ticket?.source,
      ticket?.sourceChannel,
      ticket?.source_channel,
      "manual",
    ),
  );

  if (
    rawChannel.includes("whatsapp") ||
    rawChannel === "wa"
  ) {
    return "whatsapp";
  }

  if (
    rawChannel.includes("email") ||
    rawChannel.includes("mail")
  ) {
    return "email";
  }

  if (
    rawChannel.includes("phone") ||
    rawChannel.includes("call")
  ) {
    return "phone";
  }

  if (
    rawChannel.includes("web") ||
    rawChannel.includes("form")
  ) {
    return "web";
  }

  return "manual";
};

const getChannelLabel = (channel) => {
  const labels = {
    whatsapp: "WhatsApp",
    email: "Email",
    phone: "Phone",
    web: "Web form",
    manual: "Manual log",
  };

  return labels[channel] || "Manual log";
};

const getChannelIcon = (channel) => {
  if (channel === "whatsapp") {
    return <FaWhatsapp />;
  }

  if (channel === "email") {
    return <FaEnvelope />;
  }

  if (channel === "phone") {
    return <FaPhone />;
  }

  return <FaGlobe />;
};

const getMessageChannel = (message) => {
  const channel = normalizeValue(
    firstValue(
      message?.channel,
      message?.source,
      message?.platform,
      "manual",
    ),
  );

  if (channel.includes("whatsapp")) {
    return "whatsapp";
  }

  if (
    channel.includes("email") ||
    channel.includes("mail")
  ) {
    return "email";
  }

  if (
    channel.includes("phone") ||
    channel.includes("call")
  ) {
    return "phone";
  }

  if (
    channel.includes("web") ||
    channel.includes("form")
  ) {
    return "web";
  }

  return "manual";
};

const getMessageText = (message) =>
  firstValue(
    message?.message,
    message?.text,
    message?.body,
    message?.content,
    "",
  );

const getSenderName = (message) =>
  firstValue(
    message?.senderName,
    message?.sender_name,
    message?.sender,
    message?.author,
    "Unknown sender",
  );

const getSenderRole = (message) =>
  firstValue(
    message?.senderRole,
    message?.sender_role,
    message?.participantRole,
    message?.participant_role,
    "",
  );

const getMessageDateValue = (message) =>
  firstValue(
    message?.createdAt,
    message?.created_at,
    message?.time,
    "",
  );

const isOutboundMessage = (message) => {
  const direction = normalizeValue(
    message?.direction,
  );

  if (direction) {
    return direction === "outbound";
  }

  const sender = normalizeValue(
    getSenderName(message),
  );

  return (
    sender.includes("agent") ||
    sender.includes("support") ||
    sender.includes("admin")
  );
};

const getStatusLabel = (message) => {
  const status = normalizeValue(
    firstValue(
      message?.deliveryStatus,
      message?.delivery_status,
      message?.status,
      "",
    ),
  );

  const labels = {
    saved_only: "Saved only",
    queued: "Queued",
    sent: "Sent",
    delivered: "Delivered",
    read: "Read",
    failed: "Failed",
    saved: "Saved",
  };

  return labels[status] || status;
};

const formatMessageTime = (message) => {
  const value = getMessageDateValue(message);

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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const sortMessages = (messages) =>
  [...messages].sort((first, second) => {
    const firstDate = new Date(
      getMessageDateValue(first),
    ).getTime();

    const secondDate = new Date(
      getMessageDateValue(second),
    ).getTime();

    if (
      Number.isNaN(firstDate) ||
      Number.isNaN(secondDate)
    ) {
      return 0;
    }

    return firstDate - secondDate;
  });

export default function CustomerMessagesPanel({
  ticket,
  messages = [],
  currentAgentName = "Current Agent",
  customerEmail = "",
  onOpenEmail,
  onSendMessage,
}) {
  const ticketChannel = getTicketChannel(ticket);

  /*
   * This section is intentionally minimized by default.
   */
  const [isExpanded, setIsExpanded] =
    useState(false);

  const [channelFilter, setChannelFilter] =
    useState("all");

  /*
   * No composer is shown until the agent chooses
   * WhatsApp or Manual Log.
   */
  const [composeMode, setComposeMode] =
    useState("");

  const [draft, setDraft] = useState("");
  const [sending, setSending] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setChannelFilter("all");
    setComposeMode("");
    setDraft("");
    setError("");
    setIsExpanded(false);
  }, [ticket?.id]);

  const customerPhone = firstValue(
    ticket?.customer?.phone,
    ticket?.customerPhone,
    ticket?.customer_phone,
    "Not available",
  );

  const resolvedCustomerEmail = firstValue(
    customerEmail,
    ticket?.customer?.email,
    ticket?.customerEmail,
    ticket?.customer_email,
    "Not available",
  );

  const ticketSubject = firstValue(
    ticket?.emailSubject,
    ticket?.email_subject,
    ticket?.subject,
    ticket?.title,
    "Customer communication",
  );

  const businessNumber = firstValue(
    ticket?.whatsappBusinessNumber,
    ticket?.whatsapp_business_number,
    ticket?.businessWhatsAppNumber,
    ticket?.business_whatsapp_number,
    "Company WhatsApp number",
  );

  const chatType = normalizeValue(
    firstValue(
      ticket?.whatsappChatType,
      ticket?.whatsapp_chat_type,
      ticket?.conversationType,
      ticket?.conversation_type,
      "direct",
    ),
  );

  const groupName = firstValue(
    ticket?.whatsappGroupName,
    ticket?.whatsapp_group_name,
    ticket?.groupName,
    ticket?.group_name,
    "Retailer / ASM group",
  );

  const whatsappConnected = Boolean(
    ticket?.whatsappConnected ||
      ticket?.whatsapp_connected,
  );

  const sortedMessages = useMemo(
    () => sortMessages(messages),
    [messages],
  );

  const availableChannels = useMemo(
    () =>
      [
        ...new Set(
          sortedMessages.map(
            getMessageChannel,
          ),
        ),
      ],
    [sortedMessages],
  );

  const filteredMessages = useMemo(() => {
    if (channelFilter === "all") {
      return sortedMessages;
    }

    return sortedMessages.filter(
      (message) =>
        getMessageChannel(message) ===
        channelFilter,
    );
  }, [sortedMessages, channelFilter]);

  const latestMessage =
    sortedMessages.length > 0
      ? sortedMessages[
          sortedMessages.length - 1
        ]
      : null;

  const latestMessageChannel =
    latestMessage
      ? getMessageChannel(latestMessage)
      : ticketChannel;

  const latestSender = latestMessage
    ? getSenderName(latestMessage)
    : "";

  const latestTime = latestMessage
    ? formatMessageTime(latestMessage)
    : "";

  const handleToggleExpanded = () => {
    setIsExpanded((current) => !current);
  };

  const handleEmailAction = () => {
    setComposeMode("");
    setDraft("");
    setError("");

    if (typeof onOpenEmail === "function") {
      onOpenEmail();
    }
  };

  const handleComposeMode = (mode) => {
    setComposeMode((current) =>
      current === mode ? "" : mode,
    );

    setDraft("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanMessage = draft.trim();

    if (!cleanMessage) {
      setError("Write a message first.");
      return;
    }

    if (
      typeof onSendMessage !== "function"
    ) {
      setError(
        "Message saving is not available.",
      );
      return;
    }

    setSending(true);
    setError("");

    const now = new Date();

    const messageData = {
      id: Date.now(),

      sender: currentAgentName,
      senderName: currentAgentName,
      senderRole: "Support Agent",

      direction: "outbound",

      channel:
        composeMode === "whatsapp"
          ? "whatsapp"
          : "manual",

      conversationType:
        composeMode === "whatsapp"
          ? chatType
          : "direct",

      groupName:
        composeMode === "whatsapp" &&
        chatType === "group"
          ? groupName
          : "",

      businessNumber:
        composeMode === "whatsapp"
          ? businessNumber
          : "",

      message: cleanMessage,
      body: cleanMessage,

      time: now.toLocaleString("en-PK", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),

      createdAt: now.toISOString(),

      deliveryStatus:
        composeMode === "whatsapp"
          ? whatsappConnected
            ? "queued"
            : "saved_only"
          : "saved",
    };

    try {
      await onSendMessage(messageData);

      setDraft("");
      setComposeMode("");
    } catch (sendError) {
      console.error(
        "Unable to add customer message:",
        sendError,
      );

      setError(
        sendError?.message ||
          "The message could not be added.",
      );
    } finally {
      setSending(false);
    }
  };

  const renderRouteSummary = () => {
    if (ticketChannel === "email") {
      return (
        <div className="communication-route-card email">
          <div className="communication-route-icon">
            <FaEnvelope />
          </div>

          <div className="communication-route-details">
            <span>Primary communication</span>

            <strong>{ticketSubject}</strong>

            <small>
              Customer email:{" "}
              {resolvedCustomerEmail}
            </small>

            <small>
              {messages.length > 0
                ? `${messages.length} saved ${
                    messages.length === 1
                      ? "message"
                      : "messages"
                  } in this ticket`
                : "Email thread linked; no individual messages have been saved in the CRM yet"}
            </small>
          </div>

          <button
            type="button"
            onClick={handleEmailAction}
            disabled={
              !resolvedCustomerEmail ||
              resolvedCustomerEmail ===
                "Not available"
            }
          >
            <FaEnvelope />
            Compose email
          </button>
        </div>
      );
    }

    if (ticketChannel === "whatsapp") {
      return (
        <div className="communication-route-card whatsapp">
          <div className="communication-route-icon">
            <FaWhatsapp />
          </div>

          <div className="communication-route-details">
            <span>Primary communication</span>

            <strong>
              {chatType === "group"
                ? groupName
                : customerPhone}
            </strong>

            <small>
              {chatType === "group"
                ? `WhatsApp group conversation · ${businessNumber}`
                : `Customer WhatsApp · ${customerPhone}`}
            </small>

            <small>
              {whatsappConnected
                ? "WhatsApp integration is connected"
                : "Messages can be recorded, but direct sending is not connected"}
            </small>
          </div>

          <span
            className={`communication-route-status ${
              whatsappConnected
                ? "connected"
                : "not-connected"
            }`}
          >
            {whatsappConnected
              ? "Connected"
              : "Save only"}
          </span>
        </div>
      );
    }

    if (ticketChannel === "phone") {
      return (
        <div className="communication-route-card phone">
          <div className="communication-route-icon">
            <FaPhone />
          </div>

          <div className="communication-route-details">
            <span>Primary communication</span>

            <strong>{customerPhone}</strong>

            <small>
              Phone conversation associated with this ticket
            </small>

            <small>
              Use Manual Log to record a call summary or outcome
            </small>
          </div>
        </div>
      );
    }

    return (
      <div className="communication-route-card general">
        <div className="communication-route-icon">
          <FaGlobe />
        </div>

        <div className="communication-route-details">
          <span>Primary communication</span>

          <strong>
            {getChannelLabel(ticketChannel)}
          </strong>

          <small>{ticketSubject}</small>

          <small>
            Record relevant customer contact in the timeline below
          </small>
        </div>
      </div>
    );
  };

  return (
    <section
      className={`customer-messages-panel ${
        isExpanded
          ? "customer-messages-panel--expanded"
          : "customer-messages-panel--collapsed"
      }`}
    >
      <button
        type="button"
        className="customer-messages-header"
        onClick={handleToggleExpanded}
        aria-expanded={isExpanded}
      >
        <div className="customer-messages-header-copy">
          <div className="customer-messages-title-row">
            <h2>Customer Messages</h2>

            <span
              className={`customer-message-source channel-${ticketChannel}`}
            >
              {getChannelIcon(ticketChannel)}
              {getChannelLabel(ticketChannel)}
            </span>
          </div>

          <p>
            {messages.length > 0
              ? `${messages.length} saved ${
                  messages.length === 1
                    ? "message"
                    : "messages"
                }${
                  latestSender
                    ? ` · Latest from ${latestSender}`
                    : ""
                }${
                  latestTime
                    ? ` · ${latestTime}`
                    : ""
                }`
              : `${ticketSubject} · No saved message entries yet`}
          </p>
        </div>

        <span className="customer-messages-toggle">
          {isExpanded ? (
            <>
              Minimize
              <FaChevronDown />
            </>
          ) : (
            <>
              Open
              <FaChevronRight />
            </>
          )}
        </span>
      </button>

      {isExpanded && (
        <div className="customer-messages-content">
          {renderRouteSummary()}

          <div className="customer-message-actions">
            <span className="customer-message-actions-label">
              Add communication
            </span>

            <button
              type="button"
              className="customer-message-email-action"
              onClick={handleEmailAction}
              disabled={
                !resolvedCustomerEmail ||
                resolvedCustomerEmail ===
                  "Not available"
              }
            >
              <FaEnvelope />
              Compose email
            </button>

            <button
              type="button"
              className={
                composeMode === "whatsapp"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleComposeMode("whatsapp")
              }
            >
              <FaWhatsapp />
              WhatsApp
            </button>

            <button
              type="button"
              className={
                composeMode === "manual"
                  ? "active"
                  : ""
              }
              onClick={() =>
                handleComposeMode("manual")
              }
            >
              <FaComments />
              Manual log
            </button>
          </div>

          {availableChannels.length > 1 && (
            <div className="customer-message-filters">
              <span>Show</span>

              <button
                type="button"
                className={
                  channelFilter === "all"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setChannelFilter("all")
                }
              >
                All
                <small>
                  {sortedMessages.length}
                </small>
              </button>

              {availableChannels.map(
                (channel) => {
                  const channelCount =
                    sortedMessages.filter(
                      (message) =>
                        getMessageChannel(
                          message,
                        ) === channel,
                    ).length;

                  return (
                    <button
                      type="button"
                      key={channel}
                      className={
                        channelFilter ===
                        channel
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setChannelFilter(
                          channel,
                        )
                      }
                    >
                      {getChannelIcon(channel)}
                      {getChannelLabel(channel)}
                      <small>{channelCount}</small>
                    </button>
                  );
                },
              )}
            </div>
          )}

          {filteredMessages.length > 0 ? (
            <div className="customer-message-list">
              {filteredMessages.map(
                (message, index) => {
                  const channel =
                    getMessageChannel(message);

                  const outbound =
                    isOutboundMessage(message);

                  const sender =
                    getSenderName(message);

                  const senderRole =
                    getSenderRole(message);

                  const messageText =
                    getMessageText(message);

                  const status =
                    getStatusLabel(message);

                  const messageTime =
                    formatMessageTime(message);

                  return (
                    <article
                      className={`customer-message-card ${
                        outbound
                          ? "outbound"
                          : "inbound"
                      }`}
                      key={
                        message?.id ||
                        `${messageTime}-${index}`
                      }
                    >
                      <header className="customer-message-meta">
                        <div>
                          <strong>{sender}</strong>

                          {senderRole && (
                            <span className="sender-role">
                              {senderRole}
                            </span>
                          )}
                        </div>

                        <div className="message-source-meta">
                          <span
                            className={`message-channel channel-${channel}`}
                          >
                            {getChannelIcon(channel)}
                            {getChannelLabel(channel)}
                          </span>

                          {messageTime && (
                            <time>
                              {messageTime}
                            </time>
                          )}
                        </div>
                      </header>

                      {message?.groupName && (
                        <div className="message-group-name">
                          <FaUsers />
                          {message.groupName}
                        </div>
                      )}

                      <p>
                        {messageText ||
                          "No message text was recorded."}
                      </p>

                      {status && (
                        <div className="message-delivery-status">
                          {status}
                        </div>
                      )}
                    </article>
                  );
                },
              )}
            </div>
          ) : (
            <div className="customer-messages-empty">
              <FaComments />

              <div>
                <h3>
                  No saved messages yet
                </h3>

                <p>
                  {ticketChannel === "email"
                    ? "The email conversation is linked to this ticket. Use Compose Email to respond, or Manual Log to record an offline update."
                    : "Use one of the communication actions above to add the first relevant customer update."}
                </p>
              </div>
            </div>
          )}

          {composeMode && (
            <form
              className="customer-message-composer"
              onSubmit={handleSubmit}
            >
              <div className="message-composer-heading">
                <div>
                  {composeMode === "whatsapp" ? (
                    <FaWhatsapp />
                  ) : (
                    <FaComments />
                  )}
                </div>

                <div>
                  <h3>
                    {composeMode === "whatsapp"
                      ? "WhatsApp message"
                      : "Manual communication log"}
                  </h3>

                  <p>
                    {composeMode === "whatsapp"
                      ? whatsappConnected
                        ? `Message will be queued through ${businessNumber}.`
                        : "WhatsApp is not connected. This message will be saved in the CRM history only."
                      : "Record a useful call summary, offline response or customer update."}
                  </p>
                </div>
              </div>

              {composeMode === "whatsapp" &&
                !whatsappConnected && (
                  <div className="whatsapp-integration-warning">
                    Direct WhatsApp sending is not connected. Saving this entry will not send a message to the customer.
                  </div>
                )}

              {error && (
                <div className="customer-message-error">
                  {error}
                </div>
              )}

              <textarea
                value={draft}
                onChange={(event) => {
                  setDraft(
                    event.target.value,
                  );
                  setError("");
                }}
                placeholder={
                  composeMode === "whatsapp"
                    ? "Write the WhatsApp message..."
                    : "Write a clear summary of the communication..."
                }
                disabled={sending}
                autoFocus
              />

              <div className="customer-message-composer-footer">
                <span>
                  {composeMode === "manual"
                    ? "Visible internally in this ticket history."
                    : whatsappConnected
                      ? "The delivery status will be recorded."
                      : "This will be saved only."}
                </span>

                <button
                  type="button"
                  className="customer-message-composer-cancel"
                  onClick={() => {
                    setComposeMode("");
                    setDraft("");
                    setError("");
                  }}
                  disabled={sending}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    !draft.trim() || sending
                  }
                >
                  <FaPaperPlane />

                  {sending
                    ? "Saving..."
                    : composeMode ===
                        "whatsapp"
                      ? whatsappConnected
                        ? "Queue message"
                        : "Save to history"
                      : "Save log"}
                </button>
              </div>
            </form>
          )}

          {latestMessage && (
            <div className="customer-message-latest-summary">
              <span>
                Latest communication
              </span>

              <strong>
                {getChannelLabel(
                  latestMessageChannel,
                )}
              </strong>

              <p>
                {getMessageText(latestMessage)}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
