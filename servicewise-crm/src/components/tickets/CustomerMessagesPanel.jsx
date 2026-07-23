import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaComments,
  FaEnvelope,
  FaGlobe,
  FaPaperPlane,
  FaPhone,
  FaUser,
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
    rawChannel.includes("wa")
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
    web: "Web Form",
    manual: "Manual Entry",
  };

  return labels[channel] || "Manual Entry";
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

const formatMessageTime = (message) =>
  firstValue(
    message?.time,
    message?.createdAt,
    message?.created_at,
    "",
  );

const getMessageText = (message) =>
  firstValue(
    message?.message,
    message?.text,
    message?.body,
    "",
  );

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

  if (channel.includes("email")) {
    return "email";
  }

  if (
    channel.includes("phone") ||
    channel.includes("call")
  ) {
    return "phone";
  }

  return "manual";
};

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

  const statusLabels = {
    saved_only: "Saved only",
    queued: "Queued",
    sent: "Sent",
    delivered: "Delivered",
    read: "Read",
    failed: "Failed",
    saved: "Saved",
  };

  return statusLabels[status] || status;
};

export default function CustomerMessagesPanel({
  ticket,
  messages = [],
  currentAgentName = "Current Agent",
  customerEmail = "",
  onOpenEmail,
  onSendMessage,
}) {
  const ticketChannel = getTicketChannel(ticket);

  const [channelFilter, setChannelFilter] =
    useState("all");

  const [composeMode, setComposeMode] =
    useState(
      ticketChannel === "whatsapp"
        ? "whatsapp"
        : "manual",
    );

  const [draft, setDraft] = useState("");
  const [sending, setSending] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setComposeMode(
      ticketChannel === "whatsapp"
        ? "whatsapp"
        : "manual",
    );
  }, [ticketChannel]);

  const customerPhone = firstValue(
    ticket?.customer?.phone,
    ticket?.customerPhone,
    ticket?.customer_phone,
    "N/A",
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

  const filteredMessages = useMemo(() => {
    if (channelFilter === "all") {
      return messages;
    }

    return messages.filter(
      (message) =>
        getMessageChannel(message) ===
        channelFilter,
    );
  }, [messages, channelFilter]);

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
      time: now.toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
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

  const renderChannelSummary = () => {
    if (ticketChannel === "email") {
      return (
        <div className="communication-route-card email">
          <div className="communication-route-icon">
            <FaEnvelope />
          </div>

          <div className="communication-route-details">
            <span>Email conversation</span>

            <strong>
              {ticket?.emailSubject ||
                ticket?.email_subject ||
                ticket?.subject ||
                "Customer email"}
            </strong>

            <small>
              From: {customerEmail || "N/A"}
            </small>

            <small>
              Thread ID:{" "}
              {ticket?.emailThreadId ||
                ticket?.email_thread_id ||
                ticket?.threadId ||
                ticket?.thread_id ||
                "Not linked yet"}
            </small>
          </div>

          <button
            type="button"
            onClick={onOpenEmail}
            disabled={!customerEmail}
          >
            Reply
          </button>
        </div>
      );
    }

    if (ticketChannel === "whatsapp") {
      return (
        <div className="communication-route-card whatsapp">
          <div className="communication-route-icon">
            {chatType === "group" ? (
              <FaUsers />
            ) : (
              <FaUser />
            )}
          </div>

          <div className="communication-route-details">
            <span>
              WhatsApp{" "}
              {chatType === "group"
                ? "group"
                : "direct chat"}
            </span>

            <strong>
              {chatType === "group"
                ? groupName
                : customerPhone}
            </strong>

            <small>
              Business number: {businessNumber}
            </small>
          </div>

          <span className="communication-route-status">
            {whatsappConnected
              ? "Connected"
              : "Not connected"}
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
            <span>Phone complaint</span>
            <strong>{customerPhone}</strong>
            <small>
              Calls and manual summaries appear in
              this history.
            </small>
          </div>
        </div>
      );
    }

    return (
      <div className="communication-route-card general">
        <div className="communication-route-icon">
          <FaComments />
        </div>

        <div className="communication-route-details">
          <span>
            {getChannelLabel(ticketChannel)}
          </span>

          <strong>
            Customer communication history
          </strong>

          <small>
            Email, WhatsApp and manual records can
            be linked with this ticket.
          </small>
        </div>
      </div>
    );
  };

  return (
    <section className="customer-messages-panel">
      <header className="customer-messages-header">
        <div>
          <h2>Customer Messages</h2>

          <p>
            Communication history across email,
            WhatsApp, phone and manual follow-ups.
          </p>
        </div>

        <span
          className={`customer-message-source channel-${ticketChannel}`}
        >
          {getChannelIcon(ticketChannel)}
          {getChannelLabel(ticketChannel)}
        </span>
      </header>

      {renderChannelSummary()}

      <div className="customer-message-filters">
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
        </button>

        <button
          type="button"
          className={
            channelFilter === "email"
              ? "active"
              : ""
          }
          onClick={() =>
            setChannelFilter("email")
          }
        >
          <FaEnvelope />
          Email
        </button>

        <button
          type="button"
          className={
            channelFilter === "whatsapp"
              ? "active"
              : ""
          }
          onClick={() =>
            setChannelFilter("whatsapp")
          }
        >
          <FaWhatsapp />
          WhatsApp
        </button>

        <button
          type="button"
          className={
            channelFilter === "phone"
              ? "active"
              : ""
          }
          onClick={() =>
            setChannelFilter("phone")
          }
        >
          <FaPhone />
          Phone
        </button>

        <button
          type="button"
          className={
            channelFilter === "manual"
              ? "active"
              : ""
          }
          onClick={() =>
            setChannelFilter("manual")
          }
        >
          Manual
        </button>
      </div>

      <div className="customer-message-list">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((message) => {
            const channel =
              getMessageChannel(message);
            const sender =
              getSenderName(message);
            const senderRole =
              getSenderRole(message);
            const outbound =
              isOutboundMessage(message);
            const status =
              getStatusLabel(message);

            return (
              <article
                key={
                  message.id ||
                  `${sender}-${formatMessageTime(
                    message,
                  )}`
                }
                className={`customer-message-card ${
                  outbound
                    ? "outbound"
                    : "inbound"
                }`}
              >
                <div className="customer-message-meta">
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

                    <time>
                      {formatMessageTime(message)}
                    </time>
                  </div>
                </div>

                {channel === "whatsapp" &&
                  (message.groupName ||
                    message.group_name) && (
                    <div className="message-group-name">
                      <FaUsers />
                      {message.groupName ||
                        message.group_name}
                    </div>
                  )}

                <p>{getMessageText(message)}</p>

                {status && outbound && (
                  <div className="message-delivery-status">
                    {status}
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className="customer-messages-empty">
            <FaComments />

            <h3>No messages in this view</h3>

            <p>
              Incoming email, WhatsApp and manual
              communication records will appear
              here.
            </p>
          </div>
        )}
      </div>

      <div className="customer-message-actions">
        <button
          type="button"
          className="customer-message-email-action"
          onClick={onOpenEmail}
          disabled={!customerEmail}
        >
          <FaEnvelope />
          Compose Email
        </button>

        <button
          type="button"
          className={
            composeMode === "whatsapp"
              ? "active"
              : ""
          }
          onClick={() =>
            setComposeMode("whatsapp")
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
            setComposeMode("manual")
          }
        >
          Manual Log
        </button>
      </div>

      <form
        className="customer-message-composer"
        onSubmit={handleSubmit}
      >
        <div className="message-composer-heading">
          <div>
            <h3>
              {composeMode === "whatsapp"
                ? "WhatsApp message"
                : "Add manual communication record"}
            </h3>

            <p>
              {composeMode === "whatsapp"
                ? chatType === "group"
                  ? `Destination: ${groupName}`
                  : `Destination: ${customerPhone}`
                : "Use this when communication happened outside the CRM."}
            </p>
          </div>
        </div>

        {!whatsappConnected &&
          composeMode === "whatsapp" && (
            <div className="whatsapp-integration-warning">
              WhatsApp is not connected yet. This
              entry will be saved in ticket history
              but will not be sent.
            </div>
          )}

        {error && (
          <div
            className="customer-message-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <textarea
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setError("");
          }}
          placeholder={
            composeMode === "whatsapp"
              ? "Write the WhatsApp message..."
              : "Write the message or call summary..."
          }
        />

        <div className="customer-message-composer-footer">
          <span>
            {composeMode === "whatsapp"
              ? `From ${businessNumber}`
              : "Saved as an internal communication record"}
          </span>

          <button
            type="submit"
            disabled={
              !draft.trim() || sending
            }
          >
            <FaPaperPlane />

            {sending
              ? "Saving..."
              : composeMode === "whatsapp" &&
                  whatsappConnected
                ? "Queue WhatsApp Message"
                : "Save to History"}
          </button>
        </div>
      </form>
    </section>
  );
}
