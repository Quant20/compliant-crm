import {
  useMemo,
  useState,
} from "react";

import "./SmartWritingAssistant.css";

function firstValue(...values) {
  const value = values.find(
    (item) =>
      item !== undefined &&
      item !== null &&
      String(item).trim() !== "",
  );

  return value === undefined
    ? ""
    : String(value).trim();
}

function getTicketContext(ticket) {
  return {
    customerName: firstValue(
      ticket?.customer?.name,
      ticket?.customer_name,
      ticket?.customerName,
      "Customer",
    ),

    ticketNumber: firstValue(
      ticket?.ticketNumber,
      ticket?.ticket_number,
      ticket?.id
        ? `Ticket #${ticket.id}`
        : "",
      "this ticket",
    ),

    subject: firstValue(
      ticket?.subject,
      ticket?.title,
      "the reported issue",
    ),

    category: firstValue(
      ticket?.category,
      "General Support",
    ),

    priority: firstValue(
      ticket?.priority,
      "Normal",
    ),

    status: firstValue(
      ticket?.status,
      "Open",
    ),

    assignedAgent: firstValue(
      ticket?.assignedAgent,
      ticket?.assignedAgentName,
      ticket?.assigned_agent_name,
      "Support Team",
    ),
  };
}

const CUSTOMER_TEMPLATES = [
  {
    id: "acknowledge",
    label: "Acknowledge complaint",
    create: ({
      customerName,
      ticketNumber,
      subject,
    }) => `Hello ${customerName},

Thank you for contacting us regarding ${subject}. Your complaint has been recorded under ${ticketNumber}, and our support team is reviewing it.

We will update you as soon as more information is available.

Regards,
Customer Support`,
  },
  {
    id: "investigating",
    label: "Under investigation",
    create: ({
      customerName,
      ticketNumber,
      subject,
    }) => `Hello ${customerName},

We are currently investigating ${subject} under ${ticketNumber}. The relevant team is reviewing the available information.

We will contact you once the review is completed or if any additional details are required.

Regards,
Customer Support`,
  },
  {
    id: "request-details",
    label: "Request information",
    create: ({
      customerName,
      ticketNumber,
    }) => `Hello ${customerName},

To continue our investigation for ${ticketNumber}, please share the following information:

• Transaction or reference ID
• Date and approximate time
• Amount, where applicable
• Screenshot or error message
• Any other relevant details

Please do not share your password, PIN or OTP.

Regards,
Customer Support`,
  },
  {
    id: "payment-review",
    label: "Payment review",
    create: ({
      customerName,
      ticketNumber,
    }) => `Hello ${customerName},

We are reviewing the payment-related issue reported under ${ticketNumber}. Our team will verify the transaction status and coordinate with the relevant department where required.

We will share the outcome and expected next steps after verification.

Regards,
Customer Support`,
  },
  {
    id: "delay-apology",
    label: "Delay apology",
    create: ({
      customerName,
      ticketNumber,
    }) => `Hello ${customerName},

We apologize for the delay in resolving ${ticketNumber}. The matter is still under review, and we understand the inconvenience this may have caused.

We have followed up with the relevant team and will share an update as soon as possible.

Regards,
Customer Support`,
  },
  {
    id: "resolved",
    label: "Issue resolved",
    create: ({
      customerName,
      ticketNumber,
      subject,
    }) => `Hello ${customerName},

The review of ${subject} under ${ticketNumber} has been completed, and the issue has been marked as resolved.

Please check and confirm whether everything is now working correctly. Contact us again if you continue to face the issue.

Regards,
Customer Support`,
  },
  {
    id: "follow-up",
    label: "Customer follow-up",
    create: ({
      customerName,
      ticketNumber,
    }) => `Hello ${customerName},

We are following up regarding ${ticketNumber}. Please let us know whether the issue is still occurring or if you require any further assistance.

Regards,
Customer Support`,
  },
];

const MANUAL_TEMPLATES = [
  {
    id: "call-summary",
    label: "Call summary",
    create: ({
      customerName,
      ticketNumber,
      subject,
    }) => `Call summary for ${ticketNumber}

Customer: ${customerName}
Issue: ${subject}

Discussion:
• Customer explained the reported issue.
• Relevant information was reviewed.
• Customer was informed that the matter will be investigated.

Next action:
Follow up with the relevant team and update the customer.`,
  },
  {
    id: "customer-confirmation",
    label: "Customer confirmation",
    create: ({
      customerName,
      ticketNumber,
    }) => `Customer confirmation for ${ticketNumber}

${customerName} confirmed that the required information was provided and requested an update after the review is completed.`,
  },
  {
    id: "no-response",
    label: "No response",
    create: ({
      customerName,
      ticketNumber,
    }) => `Contact attempt for ${ticketNumber}

Attempted to contact ${customerName}, but no response was received.

Next action:
Try contacting the customer again or send a written follow-up.`,
  },
  ...CUSTOMER_TEMPLATES,
];

const NOTE_TEMPLATES = [
  {
    id: "investigation-note",
    label: "Investigation summary",
    create: ({
      ticketNumber,
      subject,
      category,
      priority,
      status,
    }) => `Investigation summary

Ticket: ${ticketNumber}
Issue: ${subject}
Category: ${category}
Priority: ${priority}
Current status: ${status}

Findings:
• Reviewed the complaint and available ticket history.
• Checked the information provided by the customer.
• Further verification may be required from the relevant team.

Next action:
Continue investigation and record the outcome in the ticket.`,
  },
  {
    id: "escalation-note",
    label: "Escalation note",
    create: ({
      ticketNumber,
      subject,
      priority,
      assignedAgent,
    }) => `Escalation required

Ticket: ${ticketNumber}
Issue: ${subject}
Priority: ${priority}
Current assignee: ${assignedAgent}

Reason for escalation:
The complaint requires further review or action from another team.

Requested action:
Review the case, confirm ownership and provide the expected resolution timeline.`,
  },
  {
    id: "handover-note",
    label: "Agent handover",
    create: ({
      ticketNumber,
      subject,
      status,
    }) => `Agent handover

Ticket: ${ticketNumber}
Issue: ${subject}
Current status: ${status}

Work completed:
• Complaint details reviewed.
• Available information recorded.
• Customer communication checked.

Pending action:
Continue the investigation and update the customer after receiving confirmation from the relevant team.`,
  },
  {
    id: "pending-information",
    label: "Pending information",
    create: ({
      ticketNumber,
    }) => `Pending customer information

Ticket: ${ticketNumber}

The investigation cannot continue until the customer provides the requested information.

Required information:
• Reference or transaction ID
• Date and time
• Supporting screenshot or error message

Next action:
Follow up with the customer.`,
  },
  {
    id: "resolution-note",
    label: "Resolution summary",
    create: ({
      ticketNumber,
      subject,
    }) => `Resolution summary

Ticket: ${ticketNumber}
Issue: ${subject}

Resolution:
The complaint was reviewed and the required corrective action was completed.

Customer communication:
The customer was informed of the outcome and requested to confirm whether the issue has been resolved.

Closure check:
Confirm there are no pending actions before closing the ticket.`,
  },
  {
    id: "follow-up-note",
    label: "Follow-up reminder",
    create: ({
      ticketNumber,
      assignedAgent,
    }) => `Follow-up required

Ticket: ${ticketNumber}
Assigned agent: ${assignedAgent}

Pending task:
Follow up with the relevant department and update the customer.

The ticket should remain open until the pending action is completed.`,
  },
];

function selectTemplateFromPrompt(
  prompt,
  mode,
) {
  const normalized =
    String(prompt || "").toLowerCase();

  const templates =
    mode === "note"
      ? NOTE_TEMPLATES
      : mode === "manual"
        ? MANUAL_TEMPLATES
        : CUSTOMER_TEMPLATES;

  const keywordMap =
    mode === "note"
      ? [
          {
            words: [
              "escalate",
              "escalation",
              "supervisor",
              "manager",
            ],
            id: "escalation-note",
          },
          {
            words: [
              "handover",
              "transfer",
              "another agent",
            ],
            id: "handover-note",
          },
          {
            words: [
              "pending",
              "information",
              "documents",
              "details",
            ],
            id: "pending-information",
          },
          {
            words: [
              "resolve",
              "resolved",
              "resolution",
              "close",
            ],
            id: "resolution-note",
          },
          {
            words: [
              "follow up",
              "follow-up",
              "reminder",
            ],
            id: "follow-up-note",
          },
        ]
      : [
          {
            words: [
              "payment",
              "refund",
              "reversal",
              "transaction",
            ],
            id: "payment-review",
          },
          {
            words: [
              "details",
              "information",
              "document",
              "screenshot",
            ],
            id: "request-details",
          },
          {
            words: [
              "delay",
              "late",
              "apology",
              "sorry",
            ],
            id: "delay-apology",
          },
          {
            words: [
              "resolved",
              "fixed",
              "completed",
              "close",
            ],
            id: "resolved",
          },
          {
            words: [
              "investigate",
              "investigation",
              "review",
              "checking",
            ],
            id: "investigating",
          },
          {
            words: [
              "follow up",
              "follow-up",
              "confirmation",
            ],
            id: "follow-up",
          },
        ];

  const matchedRule = keywordMap.find(
    (rule) =>
      rule.words.some((word) =>
        normalized.includes(word),
      ),
  );

  const fallbackId =
    mode === "note"
      ? "investigation-note"
      : mode === "manual"
        ? "call-summary"
        : "acknowledge";

  return (
    templates.find(
      (template) =>
        template.id ===
        (matchedRule?.id || fallbackId),
    ) || templates[0]
  );
}

function applyTone(text, tone, mode) {
  if (mode === "note") {
    return text;
  }

  if (tone === "formal") {
    return text
      .replace(/^Hello /, "Dear ")
      .replace(
        /\nRegards,\nCustomer Support$/,
        "\nSincerely,\nCustomer Support",
      );
  }

  if (tone === "friendly") {
    return text
      .replace(/^Hello /, "Hi ")
      .replace(
        "Thank you for contacting us",
        "Thank you for reaching out",
      );
  }

  if (tone === "apologetic") {
    const firstBreak = text.indexOf("\n\n");

    if (firstBreak !== -1) {
      return (
        text.slice(0, firstBreak + 2) +
        "We sincerely apologize for the inconvenience caused.\n\n" +
        text.slice(firstBreak + 2)
      );
    }
  }

  return text;
}

export default function SmartWritingAssistant({
  ticket,
  mode = "customer",
  onInsert,
}) {
  const context = useMemo(
    () => getTicketContext(ticket),
    [ticket],
  );

  const templates =
    mode === "note"
      ? NOTE_TEMPLATES
      : mode === "manual"
        ? MANUAL_TEMPLATES
        : CUSTOMER_TEMPLATES;

  const [isOpen, setIsOpen] =
    useState(false);

  const [prompt, setPrompt] =
    useState("");

  const [tone, setTone] =
    useState("professional");

  const [preview, setPreview] =
    useState("");

  const createPreview = (template) => {
    const generated =
      template.create(context);

    setPreview(
      applyTone(
        generated,
        tone,
        mode,
      ),
    );
  };

  const createFromPrompt = () => {
    const template =
      selectTemplateFromPrompt(
        prompt,
        mode,
      );

    createPreview(template);
  };

  const insertDraft = () => {
    const cleanPreview = preview.trim();

    if (!cleanPreview) {
      return;
    }

    onInsert?.(cleanPreview);
    setIsOpen(false);
  };

  return (
    <div className="smart-writing-assistant">
      <button
        type="button"
        className="smart-writing-trigger"
        onClick={() =>
          setIsOpen((current) => !current)
        }
      >
        <span aria-hidden="true">✦</span>
        Smart Write
        <small>No API</small>
      </button>

      {isOpen && (
        <div className="smart-writing-panel">
          <div className="smart-writing-header">
            <div>
              <strong>
                Writing Assistant
              </strong>

              <span>
                Templates use the current
                ticket details.
              </span>
            </div>

            <button
              type="button"
              className="smart-writing-close"
              onClick={() =>
                setIsOpen(false)
              }
              aria-label="Close writing assistant"
            >
              ×
            </button>
          </div>

          <div className="smart-writing-controls">
            {mode !== "note" && (
              <label>
                <span>Tone</span>

                <select
                  value={tone}
                  onChange={(event) =>
                    setTone(
                      event.target.value,
                    )
                  }
                >
                  <option value="professional">
                    Professional
                  </option>

                  <option value="formal">
                    Formal
                  </option>

                  <option value="friendly">
                    Friendly
                  </option>

                  <option value="apologetic">
                    Apologetic
                  </option>
                </select>
              </label>
            )}

            <label className="smart-writing-prompt">
              <span>
                What should it write?
              </span>

              <div>
                <input
                  type="text"
                  value={prompt}
                  onChange={(event) =>
                    setPrompt(
                      event.target.value,
                    )
                  }
                  placeholder={
                    mode === "note"
                      ? "Example: escalate this ticket"
                      : "Example: request transaction details"
                  }
                />

                <button
                  type="button"
                  onClick={createFromPrompt}
                >
                  Create
                </button>
              </div>
            </label>
          </div>

          <div className="smart-writing-template-list">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() =>
                  createPreview(template)
                }
              >
                {template.label}
              </button>
            ))}
          </div>

          {preview && (
            <div className="smart-writing-preview">
              <label htmlFor="smart-writing-preview">
                Review and edit
              </label>

              <textarea
                id="smart-writing-preview"
                value={preview}
                onChange={(event) =>
                  setPreview(
                    event.target.value,
                  )
                }
              />

              <div className="smart-writing-preview-actions">
                <button
                  type="button"
                  className="smart-writing-clear"
                  onClick={() =>
                    setPreview("")
                  }
                >
                  Clear
                </button>

                <button
                  type="button"
                  className="smart-writing-insert"
                  onClick={insertDraft}
                >
                  Insert draft
                </button>
              </div>
            </div>
          )}

          <p className="smart-writing-notice">
            This is a local template assistant.
            Review every draft before sending.
          </p>
        </div>
      )}
    </div>
  );
}
