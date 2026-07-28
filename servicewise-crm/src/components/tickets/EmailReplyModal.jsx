import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FaBold,
  FaItalic,
  FaListUl,
  FaPaperPlane,
  FaPaperclip,
  FaTimes,
  FaUnderline,
} from "react-icons/fa";

import { sendTicketEmail } from "../../services/emailService";

import "./EmailReplyModal.css";

import { generateAiDraft } from "../../services/integrationService";

/* =========================================================
   TICKET HELPERS
========================================================= */

function getCustomerEmail(ticket) {
  return (
    ticket?.customer?.email ||
    ticket?.customer_email ||
    ticket?.customerEmail ||
    ""
  );
}

function getCustomerName(ticket) {
  return (
    ticket?.customer?.name ||
    ticket?.customer_name ||
    ticket?.customerName ||
    "Customer"
  );
}

function getTicketNumber(ticket) {
  return (
    ticket?.ticketNumber ||
    ticket?.ticket_number ||
    `Ticket #${ticket?.id || ""}`
  );
}

function getReplySubject(
  subject,
  ticketNumber,
) {
  const cleanSubject = String(
    subject || ticketNumber || "",
  ).trim();

  if (/^re:/i.test(cleanSubject)) {
    return cleanSubject;
  }

  return `Re: ${cleanSubject}`;
}

/* =========================================================
   EMAIL HELPERS
========================================================= */

function normalizeEmailList(...values) {
  const emails = values.flatMap((value) => {
    if (Array.isArray(value)) {
      return value;
    }

    return String(value || "").split(/[;,]/);
  });

  return [
    ...new Set(
      emails
        .map((email) =>
          String(email)
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    ),
  ];
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(email || "").trim(),
  );
}

function runEditorCommand(command) {
  document.execCommand(
    command,
    false,
    null,
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function EmailReplyModal({
  ticket,
  onClose,
  onSent,
}) {
  const bodyEditorRef = useRef(null);

  const customerEmail = useMemo(
    () => getCustomerEmail(ticket),
    [ticket],
  );

  const customerName = useMemo(
    () => getCustomerName(ticket),
    [ticket],
  );

  const ticketNumber = useMemo(
    () => getTicketNumber(ticket),
    [ticket],
  );

  const originalSenderEmails = useMemo(
    () =>
      normalizeEmailList(
        ticket?.email_from,
        ticket?.emailFrom,
        ticket?.from_email,
        ticket?.fromEmail,
        ticket?.sender_email,
        ticket?.senderEmail,
        ticket?.emailMetadata?.from,
        customerEmail,
      ),
    [ticket, customerEmail],
  );

  const originalToEmails = useMemo(
    () =>
      normalizeEmailList(
        ticket?.email_to,
        ticket?.emailTo,
        ticket?.to_emails,
        ticket?.toEmails,
        ticket?.recipients,
        ticket?.emailMetadata?.to,
      ),
    [ticket],
  );

  const originalCcEmails = useMemo(
    () =>
      normalizeEmailList(
        ticket?.email_cc,
        ticket?.emailCc,
        ticket?.cc_emails,
        ticket?.ccEmails,
        ticket?.emailMetadata?.cc,
      ),
    [ticket],
  );

  const supportMailboxEmails = useMemo(
    () =>
      normalizeEmailList(
        ticket?.support_email,
        ticket?.supportEmail,
        ticket?.mailbox_email,
        ticket?.mailboxEmail,
      ),
    [ticket],
  );

  const replyAllCcEmails = useMemo(() => {
    const senderSet = new Set(
      originalSenderEmails,
    );

    const supportSet = new Set(
      supportMailboxEmails,
    );

    return normalizeEmailList(
      originalToEmails,
      originalCcEmails,
    ).filter(
      (email) =>
        !senderSet.has(email) &&
        !supportSet.has(email),
    );
  }, [
    originalSenderEmails,
    originalToEmails,
    originalCcEmails,
    supportMailboxEmails,
  ]);

  const [mode, setMode] =
    useState("reply");

  const [to, setTo] = useState(
    originalSenderEmails.join(", ") ||
      customerEmail,
  );

  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");

  const [showCopies, setShowCopies] =
    useState(false);

  const [subject, setSubject] = useState(
    getReplySubject(
      ticket?.subject,
      ticketNumber,
    ),
  );

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    showHelpWriter,
    setShowHelpWriter,
  ] = useState(false);

  const [
    helpWriterInstruction,
    setHelpWriterInstruction,
  ] = useState("");

  const [
    isGeneratingDraft,
    setIsGeneratingDraft,
  ] = useState(false);

  /* =======================================================
     RESET WHEN TICKET CHANGES
  ======================================================= */

  useEffect(() => {
    setMode("reply");

    setTo(
      originalSenderEmails.join(", ") ||
        customerEmail,
    );

    setCc("");
    setBcc("");
    setShowCopies(false);

    setSubject(
      getReplySubject(
        ticket?.subject,
        ticketNumber,
      ),
    );

    setError("");

    if (bodyEditorRef.current) {
      bodyEditorRef.current.innerHTML = "";
    }
  }, [
    ticket?.id,
    ticket?.subject,
    ticketNumber,
    customerEmail,
    originalSenderEmails,
  ]);

  /* =======================================================
     MODAL KEYBOARD AND PAGE LOCK
  ======================================================= */

  useEffect(() => {
    const handleEscape = (event) => {
      if (
        event.key === "Escape" &&
        !sending
      ) {
        onClose?.();
      }
    };

    const previousOverflow =
      document.body.style.overflow;

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [onClose, sending]);

  /* =======================================================
     EDITOR ACTIONS
  ======================================================= */

  const applyCommand = (command) => {
    bodyEditorRef.current?.focus();

    runEditorCommand(command);
  };

  const handleCreateEmailDraft = async () => {
    const instruction =
      helpWriterInstruction.trim();

    if (!instruction) {
      setError(
        "Describe the email you want Gemini to prepare.",
      );
      return;
    }

    const existingText =
      bodyEditorRef.current?.innerText?.trim() ||
      "";

    setIsGeneratingDraft(true);
    setError("");

    try {
      const result = await generateAiDraft({
        type: "email",
        instruction,
        existingText,
        ticket: {
          ticketNumber,
          customerName,
          subject:
            ticket?.subject ||
            "Customer complaint",
          description:
            ticket?.description || "",
          status:
            ticket?.status || "Open",
          priority:
            ticket?.priority || "Normal",
          assignedAgent:
            ticket?.assignedAgent?.name ||
            ticket?.assignedAgent ||
            "",
          department:
            ticket?.department?.name ||
            ticket?.department ||
            "",
        },
      });

      if (!result?.draft) {
        throw new Error(
          "Gemini returned an empty email.",
        );
      }

      if (!bodyEditorRef.current) {
        return;
      }

      bodyEditorRef.current.innerText =
        result.draft;

      setShowHelpWriter(false);
      bodyEditorRef.current.focus();
    } catch (draftError) {
      console.error(
        "Gemini email generation failed:",
        draftError,
      );

      setError(
        draftError?.message ||
          "Gemini could not create the email.",
      );
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  /* =======================================================
     REPLY / REPLY ALL / NEW EMAIL
  ======================================================= */

  const handleModeChange = (nextMode) => {
    if (sending) {
      return;
    }

    setMode(nextMode);
    setError("");

    if (nextMode === "new") {
      setTo("");
      setCc("");
      setBcc("");
      setSubject("");
      setShowCopies(false);

      if (bodyEditorRef.current) {
        bodyEditorRef.current.innerHTML =
          "";
      }

      return;
    }

    setTo(
      originalSenderEmails.join(", ") ||
        customerEmail,
    );

    setSubject(
      getReplySubject(
        ticket?.subject,
        ticketNumber,
      ),
    );

    setBcc("");

    if (nextMode === "replyAll") {
      setCc(
        replyAllCcEmails.join(", "),
      );

      setShowCopies(
        replyAllCcEmails.length > 0,
      );
    } else {
      setCc("");
      setShowCopies(false);
    }

    if (bodyEditorRef.current) {
      bodyEditorRef.current.innerHTML = "";
    }
  };

  /* =======================================================
     SEND EMAIL
  ======================================================= */

  const handleSendEmail = async () => {
    if (sending) {
      return;
    }

    const cleanToEmails =
      normalizeEmailList(to);

    const cleanCcEmails =
      normalizeEmailList(cc).filter(
        (email) =>
          !cleanToEmails.includes(email),
      );

    const cleanBccEmails =
      normalizeEmailList(bcc).filter(
        (email) =>
          !cleanToEmails.includes(email) &&
          !cleanCcEmails.includes(email),
      );

    const cleanSubject =
      subject.trim();

    const bodyText =
      bodyEditorRef.current?.innerText
        ?.trim() || "";

    const bodyHtml =
      bodyEditorRef.current?.innerHTML
        ?.trim() || "";

    if (cleanToEmails.length === 0) {
      setError(
        "At least one recipient is required.",
      );

      return;
    }

    const invalidEmail = [
      ...cleanToEmails,
      ...cleanCcEmails,
      ...cleanBccEmails,
    ].find(
      (email) => !isValidEmail(email),
    );

    if (invalidEmail) {
      setError(
        `Invalid email address: ${invalidEmail}`,
      );

      return;
    }

    if (!cleanSubject) {
      setError(
        "Email subject is required.",
      );

      return;
    }

    if (!bodyText) {
      setError(
        "Email message is required.",
      );

      return;
    }

    setSending(true);
    setError("");

    try {
      const sentEmail =
        await sendTicketEmail({
          ticketId: ticket?.id,
          ticketNumber,
          mode,

          to: cleanToEmails,
          cc: cleanCcEmails,
          bcc: cleanBccEmails,

          subject: cleanSubject,
          bodyText,
          bodyHtml,
        });

      if (
        typeof onSent === "function"
      ) {
        await onSent({
          mode,

          to: cleanToEmails.join(", "),
          cc: cleanCcEmails.join(", "),
          bcc: cleanBccEmails.join(", "),

          subject: cleanSubject,
          body: bodyText,

          emailId:
            sentEmail?.emailId || null,

          sentDirectly: true,
        });
      }

      onClose?.();
    } catch (sendError) {
      console.error(
        "Unable to send ticket email:",
        sendError,
      );

      setError(
        sendError?.message ||
          "The email could not be sent.",
      );
    } finally {
      setSending(false);
    }
  };

  /* =======================================================
     CLOSE FROM BACKDROP
  ======================================================= */

  const handleBackdropMouseDown = (
    event,
  ) => {
    if (
      event.target ===
        event.currentTarget &&
      !sending
    ) {
      onClose?.();
    }
  };

  /* =======================================================
     INTERFACE
  ======================================================= */

  return (
    <div
      className="crm-email-backdrop"
      onMouseDown={
        handleBackdropMouseDown
      }
      role="presentation"
    >
      <section
        className="crm-email-composer"
        role="dialog"
        aria-modal="true"
        aria-label="Email customer"
      >
        <header className="crm-email-header">
          <div>
            <h2>
              {mode === "replyAll"
                ? "Reply to everyone"
                : mode === "reply"
                  ? "Reply to sender"
                  : "New email"}
            </h2>

            <p>
              {ticketNumber} ·{" "}
              {customerName}
            </p>
          </div>

          <button
            type="button"
            className="crm-email-close"
            onClick={() => onClose?.()}
            disabled={sending}
            aria-label="Close email composer"
          >
            <FaTimes />
          </button>
        </header>

        <div className="crm-email-mode-tabs">
          <button
            type="button"
            className={
              mode === "reply"
                ? "active"
                : ""
            }
            onClick={() =>
              handleModeChange("reply")
            }
            disabled={sending}
          >
            Reply
          </button>

          <button
            type="button"
            className={
              mode === "replyAll"
                ? "active"
                : ""
            }
            onClick={() =>
              handleModeChange(
                "replyAll",
              )
            }
            disabled={sending}
          >
            Reply All
          </button>

          <button
            type="button"
            className={
              mode === "new"
                ? "active"
                : ""
            }
            onClick={() =>
              handleModeChange("new")
            }
            disabled={sending}
          >
            New Email
          </button>
        </div>

        {error && (
          <div
            className="crm-email-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="crm-email-address-row">
          <label htmlFor="email-to">
            To
          </label>

          <input
            id="email-to"
            type="text"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setError("");
            }}
            placeholder="user1@example.com, user2@example.com"
            disabled={sending}
          />

          <button
            type="button"
            className="crm-email-copy-toggle"
            onClick={() =>
              setShowCopies(
                (current) => !current,
              )
            }
            disabled={sending}
          >
            Cc/Bcc
          </button>
        </div>

        {showCopies && (
          <>
            <div className="crm-email-address-row">
              <label htmlFor="email-cc">
                Cc
              </label>

              <input
                id="email-cc"
                type="text"
                value={cc}
                onChange={(event) => {
                  setCc(
                    event.target.value,
                  );

                  setError("");
                }}
                placeholder="Optional — separate emails with commas"
                disabled={sending}
              />
            </div>

            <div className="crm-email-address-row">
              <label htmlFor="email-bcc">
                Bcc
              </label>

              <input
                id="email-bcc"
                type="text"
                value={bcc}
                onChange={(event) => {
                  setBcc(
                    event.target.value,
                  );

                  setError("");
                }}
                placeholder="Optional — separate emails with commas"
                disabled={sending}
              />
            </div>
          </>
        )}

        <div className="crm-email-subject-row">
          <input
            type="text"
            value={subject}
            onChange={(event) => {
              setSubject(
                event.target.value,
              );

              setError("");
            }}
            placeholder="Subject"
            disabled={sending}
          />
        </div>

        <div className="crm-email-editor">
          <div
            ref={bodyEditorRef}
            className="crm-email-editor-area"
            contentEditable={!sending}
            suppressContentEditableWarning
            data-placeholder="Write your email message..."
            onInput={() => setError("")}
          />

          <div className="crm-email-toolbar">
              <button
                type="button"
                className="crm-email-help-write-button"
                onClick={() =>
                  setShowHelpWriter(
                    (current) => !current,
                  )
                }
                disabled={sending}
                aria-expanded={showHelpWriter}
                title="Create an email draft"
              >
                <span>✦</span>
                Help me write
              </button>

              <button
              type="button"
              onClick={() =>
                applyCommand("bold")
              }
              disabled={sending}
              aria-label="Bold"
              title="Bold"
            >
              <FaBold />
            </button>

            <button
              type="button"
              onClick={() =>
                applyCommand("italic")
              }
              disabled={sending}
              aria-label="Italic"
              title="Italic"
            >
              <FaItalic />
            </button>

            <button
              type="button"
              onClick={() =>
                applyCommand(
                  "underline",
                )
              }
              disabled={sending}
              aria-label="Underline"
              title="Underline"
            >
              <FaUnderline />
            </button>

            <button
              type="button"
              onClick={() =>
                applyCommand(
                  "insertUnorderedList",
                )
              }
              disabled={sending}
              aria-label="Bullet list"
              title="Bullet list"
            >
              <FaListUl />
            </button>

            <button
              type="button"
              disabled
              aria-label="Attachment"
              title="Attachment support will be added later"
            >
              <FaPaperclip />
            </button>
          </div>

            {showHelpWriter && (
              <section className="crm-email-help-writer-panel">
                <div className="crm-email-help-writer-heading">
                  <div>
                    <strong>
                      ✦ Help me write
                    </strong>

                    <span>
                      Describe the email you want to prepare.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowHelpWriter(false)
                    }
                    aria-label="Close writing assistant"
                  >
                    ×
                  </button>
                </div>

                <textarea
                  value={helpWriterInstruction}
                  onChange={(event) =>
                    setHelpWriterInstruction(
                      event.target.value,
                    )
                  }
                  placeholder="Example: Write a polite and detailed email apologizing for the payment delay. Tell the customer that the transaction is under investigation and that we will update them within two working days."
                  disabled={sending}
                  autoFocus
                />

                <div className="crm-email-help-writer-examples">
                  <button
                    type="button"
                    onClick={() =>
                      setHelpWriterInstruction(
                        "Acknowledge the complaint and confirm that it is under review.",
                      )
                    }
                  >
                    Acknowledge complaint
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setHelpWriterInstruction(
                        "Apologize for the payment delay and confirm that the transaction is being investigated.",
                      )
                    }
                  >
                    Payment delay
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setHelpWriterInstruction(
                        "Request the transaction reference, date, amount and screenshot from the customer.",
                      )
                    }
                  >
                    Request details
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setHelpWriterInstruction(
                        "Confirm that the issue has been resolved and ask the customer to verify it.",
                      )
                    }
                  >
                    Resolution email
                  </button>
                </div>

                <div className="crm-email-help-writer-actions">
                  <button
                    type="button"
                    className="crm-help-writer-cancel"
                    onClick={() => {
                      setHelpWriterInstruction("");
                      setShowHelpWriter(false);
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="crm-help-writer-create"
                    onClick={handleCreateEmailDraft}
                    disabled={
                      sending ||
                      isGeneratingDraft ||
                      !helpWriterInstruction.trim()
                    }
                  >
                    {isGeneratingDraft
                      ? "Generating..."
                      : "Create draft"}
                  </button>
                </div>
              </section>
            )}
        </div>

        <footer className="crm-email-footer">
          <span>
            Multiple recipients can be
            separated with commas.
          </span>

          <button
            type="button"
            className="crm-email-cancel"
            onClick={() => onClose?.()}
            disabled={sending}
          >
            Cancel
          </button>

          <button
            type="button"
            className="crm-email-send"
            onClick={handleSendEmail}
            disabled={sending}
          >
            <FaPaperPlane />

            {sending
              ? "Sending..."
              : "Send Email"}
          </button>
        </footer>
      </section>
    </div>
  );
}