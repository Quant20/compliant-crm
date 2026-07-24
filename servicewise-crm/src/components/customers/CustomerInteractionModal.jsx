import {
  useEffect,
  useState,
} from "react";

import "./CustomerInteractionModal.css";

const EMPTY_FORM = {
  type: "call",
  direction: "Inbound",
  title: "",
  details: "",
  outcome: "",
  agent: "",
  duration: "",
};

function getDefaultTitle(type) {
  const titles = {
    call: "Customer call",
    email: "Customer email",
    whatsapp: "WhatsApp interaction",
    sms: "SMS interaction",
    portal: "Portal interaction",
    meeting: "Customer meeting",
    note: "Customer note",
  };

  return titles[type] || "Customer interaction";
}

export default function CustomerInteractionModal({
  open,
  customer,
  onClose,
  onSave,
}) {
  const [formData, setFormData] =
    useState(EMPTY_FORM);

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormData({
      ...EMPTY_FORM,
      title: getDefaultTitle("call"),
    });

    setError("");
    setSaving(false);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setFormData((currentForm) => {
      const updatedForm = {
        ...currentForm,
        [name]: value,
      };

      if (
        name === "type" &&
        (!currentForm.title ||
          Object.values({
            call: "Customer call",
            email: "Customer email",
            whatsapp:
              "WhatsApp interaction",
            sms: "SMS interaction",
            portal: "Portal interaction",
            meeting: "Customer meeting",
            note: "Customer note",
          }).includes(currentForm.title))
      ) {
        updatedForm.title =
          getDefaultTitle(value);
      }

      return updatedForm;
    });
  };

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    setError("");

    if (!formData.details.trim()) {
      setError(
        "Enter details of the customer interaction.",
      );

      return;
    }

    try {
      setSaving(true);

      await Promise.resolve(
        onSave(formData),
      );

      onClose();
    } catch (saveError) {
      setError(
        saveError?.message ||
          "The interaction could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="customer-interaction-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className="customer-interaction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="interaction-title"
      >
        <header className="customer-interaction-header">
          <div>
            <span>
              Customer Journey
            </span>

            <h2 id="interaction-title">
              Log Customer Interaction
            </h2>

            <p>
              Record a call, email, WhatsApp
              message, meeting or internal note
              for {customer?.name || "this customer"}.
            </p>
          </div>

          <button
            type="button"
            className="customer-interaction-close"
            onClick={onClose}
            aria-label="Close interaction form"
          >
            ×
          </button>
        </header>

        <form
          className="customer-interaction-form"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="customer-interaction-error">
              {error}
            </div>
          )}

          <div className="customer-interaction-grid">
            <div className="customer-interaction-field">
              <label htmlFor="interaction-type">
                Interaction Type
              </label>

              <select
                id="interaction-type"
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="call">
                  Phone Call
                </option>

                <option value="email">
                  Email
                </option>

                <option value="whatsapp">
                  WhatsApp
                </option>

                <option value="sms">
                  SMS
                </option>

                <option value="portal">
                  Customer Portal
                </option>

                <option value="meeting">
                  Meeting
                </option>

                <option value="note">
                  Internal Note
                </option>
              </select>
            </div>

            <div className="customer-interaction-field">
              <label htmlFor="interaction-direction">
                Direction
              </label>

              <select
                id="interaction-direction"
                name="direction"
                value={formData.direction}
                onChange={handleChange}
              >
                <option value="Inbound">
                  Inbound
                </option>

                <option value="Outbound">
                  Outbound
                </option>

                <option value="Internal">
                  Internal
                </option>
              </select>
            </div>

            <div className="customer-interaction-field customer-interaction-full">
              <label htmlFor="interaction-subject">
                Subject
              </label>

              <input
                id="interaction-subject"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Interaction subject"
              />
            </div>

            <div className="customer-interaction-field customer-interaction-full">
              <label htmlFor="interaction-details">
                Interaction Details
                <span>*</span>
              </label>

              <textarea
                id="interaction-details"
                name="details"
                value={formData.details}
                onChange={handleChange}
                rows="5"
                placeholder="Describe what the customer said, what was discussed and what action is required..."
                autoFocus
              />
            </div>

            <div className="customer-interaction-field">
              <label htmlFor="interaction-outcome">
                Outcome
              </label>

              <select
                id="interaction-outcome"
                name="outcome"
                value={formData.outcome}
                onChange={handleChange}
              >
                <option value="">
                  Select outcome
                </option>

                <option value="Resolved">
                  Resolved
                </option>

                <option value="Follow-up Required">
                  Follow-up Required
                </option>

                <option value="Ticket Created">
                  Ticket Created
                </option>

                <option value="Escalated">
                  Escalated
                </option>

                <option value="No Response">
                  No Response
                </option>

                <option value="Information Provided">
                  Information Provided
                </option>
              </select>
            </div>

            <div className="customer-interaction-field">
              <label htmlFor="interaction-agent">
                Agent
              </label>

              <input
                id="interaction-agent"
                name="agent"
                value={formData.agent}
                onChange={handleChange}
                placeholder="Agent name"
              />
            </div>

            {formData.type === "call" && (
              <div className="customer-interaction-field">
                <label htmlFor="interaction-duration">
                  Call Duration
                </label>

                <input
                  id="interaction-duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="Example: 4m 30s"
                />
              </div>
            )}
          </div>

          <footer className="customer-interaction-actions">
            <button
              type="button"
              className="customer-interaction-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="customer-interaction-save"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Interaction"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
