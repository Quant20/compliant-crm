import {
  FaChevronDown,
  FaClock,
  FaDatabase,
  FaEnvelope,
  FaExclamationTriangle,
  FaGlobe,
  FaPhone,
  FaTag,
  FaUser,
  FaUsers,
  FaWhatsapp,
} from "react-icons/fa";

import "./TicketDetailsSidebar.css";

const firstValue = (...values) => {
  const value = values.find(
    (item) =>
      item !== undefined &&
      item !== null &&
      String(item).trim() !== "",
  );

  return value === undefined ? "" : value;
};

const displayValue = (...values) => {
  const value = firstValue(...values);
  return value === "" ? "N/A" : String(value);
};

const normalizeChannel = (ticket) => {
  const rawChannel = String(
    firstValue(
      ticket?.channel,
      ticket?.source,
      ticket?.sourceChannel,
      ticket?.source_channel,
      "manual",
    ),
  ).toLowerCase();

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

  if (
    rawChannel.includes("app") ||
    rawChannel.includes("mobile")
  ) {
    return "app";
  }

  return "manual";
};

const getChannelLabel = (channel) => {
  const labels = {
    whatsapp: "WhatsApp",
    email: "Email",
    phone: "Phone",
    web: "Web Form",
    app: "Mobile App",
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

const getMessageText = (message) =>
  String(
    firstValue(
      message?.message,
      message?.body,
      message?.text,
      "",
    ),
  );

const getMessageDirection = (message) => {
  const direction = String(
    firstValue(message?.direction, ""),
  ).toLowerCase();

  if (direction) {
    return direction;
  }

  const sender = String(
    firstValue(
      message?.senderName,
      message?.sender_name,
      message?.sender,
      "",
    ),
  ).toLowerCase();

  if (
    sender.includes("agent") ||
    sender.includes("support") ||
    sender.includes("admin")
  ) {
    return "outbound";
  }

  return "inbound";
};

const getLastMessage = (messages, direction) => {
  const matchingMessages = [...messages]
    .reverse()
    .filter(
      (message) =>
        getMessageDirection(message) === direction,
    );

  return matchingMessages[0] || null;
};

const formatShortMessage = (message) => {
  if (!message) {
    return "No message yet";
  }

  const text = getMessageText(message);

  if (!text) {
    return "Message available";
  }

  return text.length > 48
    ? `${text.slice(0, 48)}…`
    : text;
};

function PropertyRow({
  label,
  value,
  valueClassName = "",
  allowWrap = false,
}) {
  return (
    <div className="ticket-sidebar-row">
      <span>{label}</span>

      <strong
        className={`${valueClassName} ${
          allowWrap ? "allow-wrap" : ""
        }`}
        title={String(value || "")}
      >
        {value || "N/A"}
      </strong>
    </div>
  );
}

function SidebarSection({
  title,
  icon,
  children,
  open = false,
  tone = "",
}) {
  return (
    <details
      className={`ticket-sidebar-section ${tone}`}
      open={open}
    >
      <summary>
        <span className="ticket-sidebar-section-title">
          {icon}
          {title}
        </span>

        <FaChevronDown className="ticket-sidebar-chevron" />
      </summary>

      <div className="ticket-sidebar-section-body">
        {children}
      </div>
    </details>
  );
}

export default function TicketDetailsSidebar({
  ticket,
  agents = [],
  status = "Open",
  priority = "Medium",
  assignedAgent = "Unassigned",
  onStatusChange,
  onPriorityChange,
  onAgentChange,
}) {
  const channel = normalizeChannel(ticket);

  const messages =
    ticket?.messages ||
    ticket?.conversations ||
    [];

  const lastInboundMessage = getLastMessage(
    messages,
    "inbound",
  );

  const lastOutboundMessage = getLastMessage(
    messages,
    "outbound",
  );

  const customerName = displayValue(
    ticket?.customer?.name,
    ticket?.customerName,
    ticket?.customer_name,
  );

  const customerEmail = displayValue(
    ticket?.customer?.email,
    ticket?.customerEmail,
    ticket?.customer_email,
  );

  const customerPhone = displayValue(
    ticket?.customer?.phone,
    ticket?.customerPhone,
    ticket?.customer_phone,
  );

  const customerType = displayValue(
    ticket?.customer?.type,
    ticket?.customerType,
    ticket?.customer_type,
    ticket?.retailerId ||
      ticket?.retailer_id
      ? "Retailer"
      : "Customer",
  );

  const retailerId = firstValue(
    ticket?.retailerId,
    ticket?.retailer_id,
    ticket?.merchantId,
    ticket?.merchant_id,
  );

  const assignedAsm = firstValue(
    ticket?.assignedAsm,
    ticket?.assigned_asm,
    ticket?.asmName,
    ticket?.asm_name,
  );

  const cityArea = displayValue(
    ticket?.customer?.city,
    ticket?.city,
    ticket?.area,
    ticket?.location,
  );

  const sourceChannel = getChannelLabel(channel);

  const primaryContact =
    channel === "email"
      ? customerEmail
      : channel === "phone" ||
          channel === "whatsapp"
        ? customerPhone
        : displayValue(
            customerEmail,
            customerPhone,
          );

  const slaBreached = Boolean(
    ticket?.sla?.breached ||
      ticket?.sla_breached,
  );

  const slaNearDue = Boolean(
    ticket?.sla?.nearDue ||
      ticket?.sla_near_due,
  );

  const slaTone = slaBreached
    ? "danger"
    : slaNearDue
      ? "warning"
      : "success";

  const tags = Array.isArray(ticket?.tags)
    ? ticket.tags.join(", ")
    : displayValue(ticket?.tags);

  const whatsappChatType = String(
    firstValue(
      ticket?.whatsappChatType,
      ticket?.whatsapp_chat_type,
      ticket?.conversationType,
      ticket?.conversation_type,
      "direct",
    ),
  ).toLowerCase();

  return (
    <aside
      className="crm-detail-sidebar ticket-details-sidebar"
      aria-label="Ticket information"
    >
      <div className="ticket-sidebar-header">
        <div>
          <span>Ticket information</span>
          <h2>Properties</h2>
        </div>

        <span
          className={`ticket-sidebar-channel channel-${channel}`}
        >
          {getChannelIcon(channel)}
          {sourceChannel}
        </span>
      </div>

      <div className="ticket-sidebar-scroll-content">
        <SidebarSection
          title="Ticket Control"
          icon={<FaTag />}
          open
        >
          <div className="ticket-sidebar-field">
            <label htmlFor="sidebar-ticket-status">
              Status
            </label>

            <select
              id="sidebar-ticket-status"
              value={status}
              onChange={onStatusChange}
            >
              <option value="Open">Open</option>
              <option value="In Progress">
                In Progress
              </option>
              <option value="Pending">Pending</option>
              <option value="Resolved">
                Resolved
              </option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="ticket-sidebar-field">
            <label htmlFor="sidebar-ticket-priority">
              Priority
            </label>

            <select
              id="sidebar-ticket-priority"
              value={priority}
              onChange={onPriorityChange}
            >
              <option value="Low">Low</option>
              <option value="Medium">
                Medium
              </option>
              <option value="High">High</option>
              <option value="Critical">
                Critical
              </option>
            </select>
          </div>

          <div className="ticket-sidebar-field">
            <label htmlFor="sidebar-ticket-owner">
              Assigned agent
            </label>

            <select
              id="sidebar-ticket-owner"
              value={assignedAgent}
              onChange={onAgentChange}
            >
              <option value="Unassigned">
                Unassigned
              </option>

              {agents.map((agent) => (
                <option
                  key={agent.id}
                  value={agent.name}
                >
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          <PropertyRow
            label="Assigned team"
            value={displayValue(
              ticket?.team,
              ticket?.department,
              "Unassigned",
            )}
          />

          <PropertyRow
            label="Escalation level"
            value={displayValue(
              ticket?.escalationLevel,
              ticket?.escalation_level,
              "Normal",
            )}
          />
        </SidebarSection>

        <SidebarSection
          title="Customer Information"
          icon={<FaUser />}
          open
        >
          <PropertyRow
            label="Name"
            value={customerName}
          />

          <PropertyRow
            label="Customer type"
            value={customerType}
          />

          <PropertyRow
            label="Customer ID"
            value={displayValue(
              ticket?.customer?.id,
              ticket?.customerId,
              ticket?.customer_id,
            )}
          />

          {retailerId && (
            <PropertyRow
              label="Retailer ID"
              value={retailerId}
            />
          )}

          <PropertyRow
            label="Phone"
            value={customerPhone}
          />

          <PropertyRow
            label="Email"
            value={customerEmail}
            allowWrap
          />

          <PropertyRow
            label="City / Area"
            value={cityArea}
          />

          {assignedAsm && (
            <PropertyRow
              label="Assigned ASM"
              value={assignedAsm}
            />
          )}
        </SidebarSection>

        <SidebarSection
          title="Complaint Details"
          icon={<FaExclamationTriangle />}
          open
        >
          <PropertyRow
            label="Category"
            value={displayValue(
              ticket?.category,
              "General",
            )}
          />

          <PropertyRow
            label="Subcategory"
            value={displayValue(
              ticket?.subCategory,
              ticket?.sub_category,
            )}
          />

          <PropertyRow
            label="Issue type"
            value={displayValue(
              ticket?.issueType,
              ticket?.issue_type,
            )}
          />

          <PropertyRow
            label="Transaction ID"
            value={displayValue(
              ticket?.transactionId,
              ticket?.transaction_id,
              ticket?.txnId,
              ticket?.txn_id,
            )}
          />

          <PropertyRow
            label="Transaction date"
            value={displayValue(
              ticket?.transactionDate,
              ticket?.transaction_date,
            )}
          />

          <PropertyRow
            label="Amount"
            value={displayValue(
              ticket?.amount,
              ticket?.transactionAmount,
              ticket?.transaction_amount,
            )}
          />

          <PropertyRow
            label="Product / Platform"
            value={displayValue(
              ticket?.product,
              ticket?.platform,
              ticket?.service,
            )}
          />

          <PropertyRow
            label="Complaint source"
            value={sourceChannel}
          />
        </SidebarSection>

        <SidebarSection
          title="Communication Summary"
          icon={<FaEnvelope />}
          open
        >
          <PropertyRow
            label="Source channel"
            value={sourceChannel}
          />

          <PropertyRow
            label="Primary contact"
            value={primaryContact}
            allowWrap
          />

          <PropertyRow
            label="Last customer message"
            value={formatShortMessage(
              lastInboundMessage,
            )}
            allowWrap
          />

          <PropertyRow
            label="Last agent reply"
            value={formatShortMessage(
              lastOutboundMessage,
            )}
            allowWrap
          />

          <PropertyRow
            label="Unread messages"
            value={displayValue(
              ticket?.unreadMessages,
              ticket?.unread_messages,
              0,
            )}
          />

          <PropertyRow
            label="Conversation status"
            value={displayValue(
              ticket?.conversationStatus,
              ticket?.conversation_status,
              status === "Closed"
                ? "Closed"
                : "Active",
            )}
          />
        </SidebarSection>

        <SidebarSection
          title={`${sourceChannel} Details`}
          icon={getChannelIcon(channel)}
          open
        >
          {channel === "email" && (
            <>
              <PropertyRow
                label="Sender email"
                value={displayValue(
                  ticket?.senderEmail,
                  ticket?.sender_email,
                  customerEmail,
                )}
                allowWrap
              />

              <PropertyRow
                label="Recipient email"
                value={displayValue(
                  ticket?.recipientEmail,
                  ticket?.recipient_email,
                  ticket?.supportEmail,
                  ticket?.support_email,
                )}
                allowWrap
              />

              <PropertyRow
                label="Email subject"
                value={displayValue(
                  ticket?.emailSubject,
                  ticket?.email_subject,
                  ticket?.subject,
                )}
                allowWrap
              />

              <PropertyRow
                label="Email thread ID"
                value={displayValue(
                  ticket?.emailThreadId,
                  ticket?.email_thread_id,
                  ticket?.threadId,
                  ticket?.thread_id,
                )}
                allowWrap
              />

              <PropertyRow
                label="Last email received"
                value={displayValue(
                  ticket?.lastEmailReceived,
                  ticket?.last_email_received,
                )}
              />

              <PropertyRow
                label="Last email sent"
                value={displayValue(
                  ticket?.lastEmailSent,
                  ticket?.last_email_sent,
                )}
              />
            </>
          )}

          {channel === "whatsapp" && (
            <>
              <PropertyRow
                label="Business number"
                value={displayValue(
                  ticket?.whatsappBusinessNumber,
                  ticket?.whatsapp_business_number,
                  ticket?.businessWhatsAppNumber,
                  ticket?.business_whatsapp_number,
                )}
              />

              <PropertyRow
                label="Chat type"
                value={
                  whatsappChatType === "group"
                    ? "Group"
                    : "Direct"
                }
              />

              {whatsappChatType === "group" ? (
                <>
                  <PropertyRow
                    label="Group name"
                    value={displayValue(
                      ticket?.whatsappGroupName,
                      ticket?.whatsapp_group_name,
                      ticket?.groupName,
                      ticket?.group_name,
                    )}
                    allowWrap
                  />

                  <PropertyRow
                    label="Group ID"
                    value={displayValue(
                      ticket?.whatsappGroupId,
                      ticket?.whatsapp_group_id,
                      ticket?.whatsappChatId,
                      ticket?.whatsapp_chat_id,
                    )}
                    allowWrap
                  />

                  <PropertyRow
                    label="Latest sender"
                    value={displayValue(
                      lastInboundMessage?.senderName,
                      lastInboundMessage?.sender_name,
                      lastInboundMessage?.sender,
                    )}
                  />

                  <PropertyRow
                    label="Sender role"
                    value={displayValue(
                      lastInboundMessage?.senderRole,
                      lastInboundMessage?.sender_role,
                      lastInboundMessage?.participantRole,
                      lastInboundMessage?.participant_role,
                    )}
                  />
                </>
              ) : (
                <>
                  <PropertyRow
                    label="Customer number"
                    value={customerPhone}
                  />

                  <PropertyRow
                    label="WhatsApp contact"
                    value={customerName}
                  />

                  <PropertyRow
                    label="Chat ID"
                    value={displayValue(
                      ticket?.whatsappChatId,
                      ticket?.whatsapp_chat_id,
                    )}
                    allowWrap
                  />
                </>
              )}
            </>
          )}

          {channel === "phone" && (
            <>
              <PropertyRow
                label="Caller number"
                value={customerPhone}
              />

              <PropertyRow
                label="Call direction"
                value={displayValue(
                  ticket?.callDirection,
                  ticket?.call_direction,
                )}
              />

              <PropertyRow
                label="Last call time"
                value={displayValue(
                  ticket?.lastCallTime,
                  ticket?.last_call_time,
                )}
              />

              <PropertyRow
                label="Call recording"
                value={displayValue(
                  ticket?.callRecording,
                  ticket?.call_recording,
                )}
                allowWrap
              />
            </>
          )}

          {(channel === "web" ||
            channel === "app" ||
            channel === "manual") && (
            <>
              <PropertyRow
                label="Submitted through"
                value={sourceChannel}
              />

              <PropertyRow
                label="Source reference"
                value={displayValue(
                  ticket?.sourceReference,
                  ticket?.source_reference,
                  ticket?.externalReference,
                  ticket?.external_reference,
                )}
                allowWrap
              />

              <PropertyRow
                label="Contact email"
                value={customerEmail}
                allowWrap
              />

              <PropertyRow
                label="Contact phone"
                value={customerPhone}
              />
            </>
          )}
        </SidebarSection>

        <SidebarSection
          title="SLA and Escalation"
          icon={<FaClock />}
          open={slaBreached || slaNearDue}
          tone={slaTone}
        >
          <div
            className={`ticket-sidebar-sla-status ${slaTone}`}
          >
            <span>SLA status</span>

            <strong>
              {slaBreached
                ? "Breached"
                : slaNearDue
                  ? "Near deadline"
                  : "Within SLA"}
            </strong>
          </div>

          <PropertyRow
            label="Policy"
            value={displayValue(
              ticket?.sla?.policy,
              ticket?.slaPolicy,
              ticket?.sla_policy,
            )}
          />

          <PropertyRow
            label="First response due"
            value={displayValue(
              ticket?.sla?.responseTarget,
              ticket?.firstResponseDue,
              ticket?.first_response_due,
              ticket?.sla_hours,
            )}
          />

          <PropertyRow
            label="Resolution due"
            value={displayValue(
              ticket?.sla?.resolutionTarget,
              ticket?.resolutionDue,
              ticket?.resolution_due,
              ticket?.sla_due_at,
            )}
          />

          <PropertyRow
            label="Time remaining"
            value={displayValue(
              ticket?.sla?.timeRemaining,
              ticket?.timeRemaining,
              ticket?.time_remaining,
            )}
            valueClassName={
              slaBreached
                ? "value-danger"
                : slaNearDue
                  ? "value-warning"
                  : "value-success"
            }
          />

          <PropertyRow
            label="Escalated to"
            value={displayValue(
              ticket?.escalatedTo,
              ticket?.escalated_to,
            )}
          />

          <PropertyRow
            label="Escalation reason"
            value={displayValue(
              ticket?.escalationReason,
              ticket?.escalation_reason,
            )}
            allowWrap
          />
        </SidebarSection>

        <SidebarSection
          title="Important Dates"
          icon={<FaClock />}
        >
          <PropertyRow
            label="Created"
            value={displayValue(
              ticket?.createdAt,
              ticket?.created_at,
              ticket?.received_at,
            )}
          />

          <PropertyRow
            label="First response"
            value={displayValue(
              ticket?.firstResponseAt,
              ticket?.first_response_at,
            )}
          />

          <PropertyRow
            label="Last updated"
            value={displayValue(
              ticket?.updatedAt,
              ticket?.updated_at,
            )}
          />

          <PropertyRow
            label="Resolved"
            value={displayValue(
              ticket?.resolvedAt,
              ticket?.resolved_at,
            )}
          />

          <PropertyRow
            label="Closed"
            value={displayValue(
              ticket?.closedAt,
              ticket?.closed_at,
            )}
          />
        </SidebarSection>

        <SidebarSection
          title="System Information"
          icon={<FaDatabase />}
        >
          <PropertyRow
            label="Ticket ID"
            value={displayValue(
              ticket?.ticketNumber,
              ticket?.ticket_number,
              ticket?.id,
            )}
            allowWrap
          />

          <PropertyRow
            label="Database ID"
            value={displayValue(ticket?.id)}
            allowWrap
          />

          <PropertyRow
            label="Source reference"
            value={displayValue(
              ticket?.sourceReference,
              ticket?.source_reference,
              ticket?.externalReference,
              ticket?.external_reference,
            )}
            allowWrap
          />

          <PropertyRow
            label="Created by"
            value={displayValue(
              ticket?.createdBy,
              ticket?.created_by,
              "System",
            )}
          />

          <PropertyRow
            label="Last updated by"
            value={displayValue(
              ticket?.updatedBy,
              ticket?.updated_by,
            )}
          />

          <PropertyRow
            label="Tags"
            value={tags}
            allowWrap
          />
        </SidebarSection>
      </div>
    </aside>
  );
}
