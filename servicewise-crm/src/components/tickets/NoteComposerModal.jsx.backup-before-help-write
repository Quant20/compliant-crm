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

  const [isExpanded, setIsExpanded] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [hasContent, setHasContent] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow =
      document.body.style.overflow;

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    document.body.style.overflow = "hidden";

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
  }, [onClose]);

  const applyCommand = (command) => {
    editorRef.current?.focus();
    runEditorCommand(command);
  };

  const handleEditorInput = () => {
    const text =
      editorRef.current?.innerText?.trim() ||
      "";

    setHasContent(Boolean(text));
    setError("");
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

      onClose();
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
    if (event.target === event.currentTarget) {
      onClose();
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
              aria-label="Expand note composer"
              title="Expand"
            >
              <FaExpandAlt />
            </button>

            <button
              type="button"
              className="crm-email-close"
              onClick={onClose}
              aria-label="Close note composer"
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
            {ticket?.subject || ticketNumber}
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
              onMouseDown={(event) =>
                event.preventDefault()
              }
              onClick={() =>
                applyCommand("bold")
              }
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
