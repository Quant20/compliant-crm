import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FaBold,
  FaExpandAlt,
  FaItalic,
  FaListOl,
  FaListUl,
  FaPaperclip,
  FaStrikethrough,
  FaTimes,
  FaUnderline,
} from "react-icons/fa";

import "./EmailReplyModal.css";
import "./NoteComposerModal.css";

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

function getTicketSubject(ticket) {
  return (
    ticket?.subject ||
    ticket?.title ||
    "Customer complaint"
  );
}

function getTicketDescription(ticket) {
  return (
    ticket?.description ||
    ticket?.issue ||
    ticket?.message ||
    ""
  );
}

function getAssignedAgent(ticket) {
  return (
    ticket?.assignedAgent?.name ||
    ticket?.assignedAgent ||
    ticket?.assigned_agent ||
    "Support team"
  );
}

function getAssignedDepartment(ticket) {
  return (
    ticket?.department ||
    ticket?.assignedDepartment ||
    ticket?.assigned_department ||
    "Relevant department"
  );
}

function runEditorCommand(command) {
  document.execCommand(command, false);
}

export default function NoteComposerModal({
  ticket,
  currentUserName = "Current Agent",
  onClose,
  onSave,
}) {
  const editorRef = useRef(null);

  const ticketNumber = useMemo(
    () => getTicketNumber(ticket),
    [ticket],
  );

  const customerName = useMemo(
    () => getCustomerName(ticket),
    [ticket],
  );

  const ticketSubject = useMemo(
    () => getTicketSubject(ticket),
    [ticket],
  );

  const ticketDescription = useMemo(
    () => getTicketDescription(ticket),
    [ticket],
  );

  const assignedAgent = useMemo(
    () => getAssignedAgent(ticket),
    [ticket],
  );

  const assignedDepartment = useMemo(
    () => getAssignedDepartment(ticket),
    [ticket],
  );

  const [isExpanded, setIsExpanded] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [hasContent, setHasContent] =
    useState(false);

  const [error, setError] = useState("");

  const [
    showHelpWriter,
    setShowHelpWriter,
  ] = useState(false);

  const [
    helpWriterInstruction,
    setHelpWriterInstruction,
  ] = useState("");

  useEffect(() => {
    const handleEscape = (event) => {
      if (
        event.key === "Escape" &&
        !isSaving
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

    const focusTimer = window.setTimeout(() => {
      editorRef.current?.focus();
    }, 80);

    return () => {
      window.clearTimeout(focusTimer);

      document.removeEventListener(
        "keydown",
        handleEscape,
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [onClose, isSaving]);

  const applyCommand = (command) => {
    editorRef.current?.focus();
    runEditorCommand(command);
  };

  const updateContentState = () => {
    const text =
      editorRef.current?.innerText?.trim() ||
      "";

    setHasContent(Boolean(text));
    setError("");
  };

  const handleEditorInput = () => {
    updateContentState();
  };

  const setEditorText = (text) => {
    if (!editorRef.current) {
      return;
    }

    editorRef.current.innerText = text;
    setHasContent(Boolean(text.trim()));
    setError("");
    setShowHelpWriter(false);

    window.setTimeout(() => {
      editorRef.current?.focus();
    }, 0);
  };

  const handleCreateNoteDraft = () => {
    const request =
      helpWriterInstruction.trim();

    const normalizedRequest =
      request.toLowerCase();

    const existingText =
      editorRef.current?.innerText?.trim() ||
      "";

    const status =
      ticket?.status || "Open";

    const priority =
      ticket?.priority || "Normal";

    let draft = `Issue:
${ticketSubject}

Current status:
The complaint is currently under review.

Action taken:
The case has been reviewed and the available ticket information has been checked.

Next action:
Follow up with ${assignedDepartment} and update the customer when confirmation is received.

Reference:
${ticketNumber}`;

    if (
      normalizedRequest.includes("summar") ||
      normalizedRequest.includes("overview")
    ) {
      draft = `Ticket summary:

• Reference: ${ticketNumber}
• Customer: ${customerName}
• Issue: ${ticketSubject}
• Status: ${status}
• Priority: ${priority}
• Assigned to: ${assignedAgent}
• Department: ${assignedDepartment}${
        ticketDescription
          ? `\n• Details: ${ticketDescription}`
          : ""
      }

Next action:
Review the case with ${assignedDepartment} and record the confirmed outcome.`;
    } else if (
      normalizedRequest.includes("payment") ||
      normalizedRequest.includes("transaction") ||
      normalizedRequest.includes("refund") ||
      normalizedRequest.includes("reversal")
    ) {
      draft = `Customer reported a payment-related issue under ${ticketNumber}.

The transaction details require verification with ${assignedDepartment}. The case remains under review, and no final outcome has been confirmed yet.

Next action:
Verify the transaction status, reconciliation record and reference details before updating the customer.`;
    } else if (
      normalizedRequest.includes("escalat") ||
      normalizedRequest.includes("urgent") ||
      normalizedRequest.includes("priority")
    ) {
      draft = `${ticketNumber} has been escalated to ${assignedDepartment} due to the pending ${ticketSubject.toLowerCase()}.

Current status: ${status}
Priority: ${priority}

Next action:
The assigned team should review the case on priority and provide a confirmed update for the customer.`;
    } else if (
      normalizedRequest.includes("follow") ||
      normalizedRequest.includes("pending") ||
      normalizedRequest.includes("waiting")
    ) {
      draft = `Follow-up note for ${ticketNumber}:

The case is still pending with ${assignedDepartment}. A confirmed resolution has not yet been received.

Next action:
Follow up with the assigned team and update the ticket once a response is received.`;
    } else if (
      normalizedRequest.includes("resolved") ||
      normalizedRequest.includes("fixed") ||
      normalizedRequest.includes("close")
    ) {
      draft = `Resolution note for ${ticketNumber}:

The reported issue, "${ticketSubject}", has been reviewed and marked as resolved.

Action completed:
The required review or correction has been completed by ${assignedDepartment}.

Next action:
Confirm the outcome with the customer before closing the ticket permanently.`;
    } else if (
      normalizedRequest.includes("detail") ||
      normalizedRequest.includes("information") ||
      normalizedRequest.includes("document") ||
      normalizedRequest.includes("screenshot")
    ) {
      draft = `Additional information is required to continue the investigation for ${ticketNumber}.

Required details:
• Transaction or reference ID
• Date and approximate time
• Amount, where applicable
• Screenshot or exact error message
• Any supporting document

Next action:
Request the missing details from the customer and resume the investigation after receipt.`;
    } else if (
      normalizedRequest.includes("short") ||
      normalizedRequest.includes("concise")
    ) {
      draft = `${ticketNumber}: ${ticketSubject} is under review with ${assignedDepartment}. Follow-up is pending, and the customer should be updated after confirmation.`;
    } else if (
      normalizedRequest.includes("next action") ||
      normalizedRequest.includes("next step")
    ) {
      draft = existingText
        ? `${existingText}

Next action:
Follow up with ${assignedDepartment}, confirm the current status and update the customer.`
        : `Next action for ${ticketNumber}:

Follow up with ${assignedDepartment}, confirm the current status and update the customer once verified.`;
    } else if (
      normalizedRequest.includes("improve") ||
      normalizedRequest.includes("professional") ||
      normalizedRequest.includes("rewrite")
    ) {
      if (existingText) {
        draft = `Internal update for ${ticketNumber}:

${existingText}

Next action:
Review any pending requirement with ${assignedDepartment} and record the confirmed outcome.`;
      } else {
        draft = `Internal update for ${ticketNumber}:

The reported issue is currently under review. The available ticket information has been checked, and the matter is awaiting confirmation from ${assignedDepartment}.

Next action:
Follow up with the relevant team and update the customer after verification.`;
      }
    } else if (request) {
      draft = `Internal note for ${ticketNumber}:

${request}

Ticket issue:
${ticketSubject}

Current status:
${status}

Next action:
Follow up with ${assignedDepartment} and record the confirmed outcome.`;
    }

    setEditorText(draft);
  };

  const handleSubmit = async () => {
    const note =
      editorRef.current?.innerText?.trim() ||
      "";

    const html =
      editorRef.current?.innerHTML || "";

    if (!note) {
      setError("Write a note before saving.");
      editorRef.current?.focus();
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      if (typeof onSave === "function") {
        await onSave({
          note,
          html,
          author: currentUserName,
          createdAt: new Date().toISOString(),
        });
      }

      onClose?.();
    } catch (saveError) {
      console.error(
        "Unable to save note:",
        saveError,
      );

      setError(
        saveError?.message ||
          "The note could not be saved.",
      );

      setIsSaving(false);
    }
  };

  const handleBackdropMouseDown = (event) => {
    if (
      event.target === event.currentTarget &&
      !isSaving
    ) {
      onClose?.();
    }
  };

  return (
    <div
      className="crm-email-backdrop"
      onMouseDown={handleBackdropMouseDown}
      role="presentation"
    >
      <section
        className={`crm-email-composer crm-note-email-composer ${
          isExpanded
            ? "crm-note-email-composer-expanded"
            : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Internal note composer"
      >
        <header className="crm-email-header">
          <div>
            <h2>Internal note</h2>

            <p>
              {ticketNumber} · {customerName}
            </p>
          </div>

          <div className="crm-note-header-actions">
            <button
              type="button"
              className="crm-email-close"
              onClick={() =>
                setIsExpanded(
                  (current) => !current,
                )
              }
              aria-label={
                isExpanded
                  ? "Restore note composer"
                  : "Expand note composer"
              }
              title={
                isExpanded
                  ? "Restore"
                  : "Expand"
              }
              disabled={isSaving}
            >
              <FaExpandAlt />
            </button>

            <button
              type="button"
              className="crm-email-close"
              onClick={onClose}
              aria-label="Close note composer"
              disabled={isSaving}
            >
              <FaTimes />
            </button>
          </div>
        </header>

        <div className="crm-email-mode-tabs">
          <button
            type="button"
            className="active"
          >
            Private note
          </button>
        </div>

        {error && (
          <div className="crm-email-error">
            {error}
          </div>
        )}

        <div className="crm-note-for-row">
          <span>For</span>

          <strong>
            {ticketSubject || ticketNumber}
          </strong>
        </div>

        <div className="crm-email-editor crm-note-editor-shell">
          <div
            ref={editorRef}
            className="crm-email-editor-area crm-note-editor-area"
            contentEditable={!isSaving}
            suppressContentEditableWarning
            data-placeholder="Start typing to leave an internal note..."
            onInput={handleEditorInput}
          />

          <div className="crm-email-toolbar">
            <button
              type="button"
              className="crm-email-help-write-button"
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={() =>
                setShowHelpWriter(
                  (current) => !current,
                )
              }
              disabled={isSaving}
              aria-expanded={showHelpWriter}
              title="Create an internal note draft"
            >
              <span>✦</span>
              Help me write
            </button>

            <button
              type="button"
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={() =>
                applyCommand("bold")
              }
              disabled={isSaving}
              aria-label="Bold"
              title="Bold"
            >
              <FaBold />
            </button>

            <button
              type="button"
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={() =>
                applyCommand("italic")
              }
              disabled={isSaving}
              aria-label="Italic"
              title="Italic"
            >
              <FaItalic />
            </button>

            <button
              type="button"
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={() =>
                applyCommand("underline")
              }
              disabled={isSaving}
              aria-label="Underline"
              title="Underline"
            >
              <FaUnderline />
            </button>

            <button
              type="button"
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={() =>
                applyCommand("strikeThrough")
              }
              disabled={isSaving}
              aria-label="Strikethrough"
              title="Strikethrough"
            >
              <FaStrikethrough />
            </button>

            <button
              type="button"
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={() =>
                applyCommand(
                  "insertUnorderedList",
                )
              }
              disabled={isSaving}
              aria-label="Bullet list"
              title="Bullet list"
            >
              <FaListUl />
            </button>

            <button
              type="button"
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={() =>
                applyCommand(
                  "insertOrderedList",
                )
              }
              disabled={isSaving}
              aria-label="Numbered list"
              title="Numbered list"
            >
              <FaListOl />
            </button>

            <button
              type="button"
              disabled
              aria-label="Attachment"
              title="Note attachments require storage integration"
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
                    Describe the internal note you want to prepare.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowHelpWriter(false)
                  }
                  aria-label="Close writing assistant"
                  disabled={isSaving}
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
                placeholder="Example: Summarize the ticket and add the next action for the operations team."
                disabled={isSaving}
                autoFocus
              />

              <div className="crm-email-help-writer-examples">
                <button
                  type="button"
                  onClick={() =>
                    setHelpWriterInstruction(
                      "Summarize this ticket and add the next action.",
                    )
                  }
                  disabled={isSaving}
                >
                  Summarize ticket
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setHelpWriterInstruction(
                      "Write a concise internal note about the payment issue.",
                    )
                  }
                  disabled={isSaving}
                >
                  Payment note
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setHelpWriterInstruction(
                      "Write an escalation note for the relevant department.",
                    )
                  }
                  disabled={isSaving}
                >
                  Escalation note
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setHelpWriterInstruction(
                      "Improve the existing note and make it professional.",
                    )
                  }
                  disabled={isSaving}
                >
                  Improve note
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setHelpWriterInstruction(
                      "Make the internal note short and concise.",
                    )
                  }
                  disabled={isSaving}
                >
                  Make concise
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setHelpWriterInstruction(
                      "Add a clear next action to the existing note.",
                    )
                  }
                  disabled={isSaving}
                >
                  Add next action
                </button>
              </div>

              <div className="crm-email-help-writer-actions">
                <button
                  type="button"
                  className="crm-help-writer-cancel"
                  onClick={() =>
                    setShowHelpWriter(false)
                  }
                  disabled={isSaving}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="crm-help-writer-create"
                  onClick={handleCreateNoteDraft}
                  disabled={isSaving}
                >
                  Create note
                </button>
              </div>
            </section>
          )}
        </div>

        <div className="crm-note-associated-row">
          Associated with
          <strong>{ticketNumber}</strong>
          <strong>{customerName}</strong>
        </div>

        <footer className="crm-email-footer">
          <span>
            Visible only to the support team.
          </span>

          <button
            type="button"
            className="crm-email-cancel"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="crm-email-send"
            onClick={handleSubmit}
            disabled={!hasContent || isSaving}
          >
            {isSaving
              ? "Saving note..."
              : "Create note"}
          </button>
        </footer>
      </section>
    </div>
  );
}
