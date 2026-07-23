import { useEffect, useState } from "react";

import { useTickets } from "../../context/TicketContext";
import users from "../../data/users";

import "./CreateTicketModal.css";

const initialForm = {
  subject: "",
  customer: "",
  email: "",
  category: "General",
  priority: "Medium",
  assignedAgent: "",
  department: "Support",
  description: "",
};

export default function CreateTicketModal({
  open,
  onClose,
}) {
  const { createTicket } = useTickets();

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const supportAgents = users.filter(
    (user) =>
      user.role === "Support Agent" &&
      user.accountStatus === "Active"
  );

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );

      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setError("");
  };

  const handleClose = () => {
    setForm(initialForm);
    setError("");
    setIsSubmitting(false);
    onClose();
  };

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const handleSubmit = async(event) => {
    event.preventDefault();

    const cleanSubject = form.subject.trim();
    const cleanCustomer = form.customer.trim();
    const cleanEmail = form.email.trim();
    const cleanDescription =
      form.description.trim();

    if (
      !cleanSubject ||
      !cleanCustomer ||
      !cleanEmail ||
      !cleanDescription
    ) {
      setError(
        "Please complete all required fields."
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const selectedAgent = supportAgents.find(
        (agent) =>
          String(agent.id) ===
          String(form.assignedAgent)
      );

      await createTicket({
        subject: cleanSubject,
        description: cleanDescription,

        customer: {
          id: Date.now(),
          name: cleanCustomer,
          email: cleanEmail,
        },

        category: form.category,
        priority: form.priority,

        assignedAgent: selectedAgent
          ? selectedAgent.name
          : "Unassigned",

        assignedAgentId: selectedAgent
          ? selectedAgent.id
          : null,

        department: form.department,

        slaHours:
  form.priority === "Critical"
    ? 4
    : form.priority === "High"
      ? 8
      : form.priority === "Medium"
        ? 24
        : 48,
      });

      setForm(initialForm);
      setError("");
      onClose();
    } catch (submitError) {
      console.error(
        "Ticket creation failed:",
        submitError
      );

      setError(
        "The ticket could not be created. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="create-ticket-overlay"
      onMouseDown={handleOverlayClick}
      role="presentation"
    >
      <div
        className="create-ticket-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-ticket-title"
      >
        <header className="create-ticket-header">
          <div>
            <span className="create-ticket-eyebrow">
              Complaint Management
            </span>

            <h2 id="create-ticket-title">
              Create Complaint Ticket
            </h2>

            <p>
              Register a customer complaint and
              assign it to the appropriate team.
            </p>
          </div>

          <button
            type="button"
            className="create-ticket-close"
            onClick={handleClose}
            aria-label="Close create ticket form"
          >
            ×
          </button>
        </header>

        <form
          className="create-ticket-form"
          onSubmit={handleSubmit}
          noValidate
        >
          {error && (
            <div
              className="create-ticket-error"
              role="alert"
            >
              <span>!</span>
              {error}
            </div>
          )}

          <section className="create-ticket-section">
            <div className="create-ticket-section-heading">
              <h3>Complaint information</h3>

              <p>
                Enter the main complaint details.
              </p>
            </div>

            <div className="create-ticket-grid">
              <div className="create-ticket-field create-ticket-field-full">
                <label htmlFor="ticket-subject">
                  Complaint subject
                  <span>*</span>
                </label>

                <input
                  id="ticket-subject"
                  name="subject"
                  type="text"
                  placeholder="Enter a short complaint subject"
                  value={form.subject}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="create-ticket-field">
                <label htmlFor="ticket-category">
                  Category
                </label>

                <select
                  id="ticket-category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="General">
                    General
                  </option>

                  <option value="Payments">
                    Payments
                  </option>

                  <option value="Authentication">
                    Authentication
                  </option>

                  <option value="Technical">
                    Technical
                  </option>

                  <option value="Account">
                    Account
                  </option>
                </select>
              </div>

              <div className="create-ticket-field">
                <label htmlFor="ticket-priority">
                  Priority
                </label>

                <select
                  id="ticket-priority"
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="Low">Low</option>

                  <option value="Medium">
                    Medium
                  </option>

                  <option value="High">
                    High
                  </option>

                  <option value="Critical">
                    Critical
                  </option>
                </select>
              </div>

              <div className="create-ticket-field create-ticket-field-full">
                <label htmlFor="ticket-description">
                  Complaint details
                  <span>*</span>
                </label>

                <textarea
                  id="ticket-description"
                  name="description"
                  placeholder="Describe the customer's complaint, issue and any important details..."
                  value={form.description}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  rows={6}
                  required
                />

                <small>
                  {form.description.length} characters
                </small>
              </div>
            </div>
          </section>

          <section className="create-ticket-section">
            <div className="create-ticket-section-heading">
              <h3>Customer information</h3>

              <p>
                Add the customer contact details.
              </p>
            </div>

            <div className="create-ticket-grid">
              <div className="create-ticket-field">
                <label htmlFor="ticket-customer">
                  Customer name
                  <span>*</span>
                </label>

                <input
                  id="ticket-customer"
                  name="customer"
                  type="text"
                  placeholder="Enter customer name"
                  value={form.customer}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="create-ticket-field">
                <label htmlFor="ticket-email">
                  Customer email
                  <span>*</span>
                </label>

                <input
                  id="ticket-email"
                  name="email"
                  type="email"
                  placeholder="customer@example.com"
                  value={form.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
          </section>

          <section className="create-ticket-section">
            <div className="create-ticket-section-heading">
              <h3>Assignment</h3>

              <p>
                Select the responsible department
                and agent.
              </p>
            </div>

            <div className="create-ticket-grid">
              <div className="create-ticket-field">
                <label htmlFor="ticket-department">
                  Department
                </label>

                <select
                  id="ticket-department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="Support">
                    Support
                  </option>

                  <option value="Operations">
                    Operations
                  </option>

                  <option value="Finance">
                    Finance
                  </option>

                  <option value="Technical">
                    Technical
                  </option>

                  <option value="Compliance">
                    Compliance
                  </option>
                </select>
              </div>

              <div className="create-ticket-field">
                <label htmlFor="ticket-agent">
                  Assign agent
                </label>

                <select
                  id="ticket-agent"
                  name="assignedAgent"
                  value={form.assignedAgent}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="">
                    Unassigned
                  </option>

                  {supportAgents.map((agent) => (
                    <option
                      key={agent.id}
                      value={agent.id}
                    >
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <footer className="create-ticket-actions">
            <button
              type="button"
              className="create-ticket-cancel"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="create-ticket-submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Creating ticket..."
                : "Create Ticket"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}