import {
  useEffect,
  useState,
} from "react";

import "./AgentFormModal.css";

const EMPTY_FORM = {
  employeeId: "",
  name: "",
  username: "",
  email: "",
  phone: "",
  department: "Customer Support",
  role: "Support Agent",
  accountStatus: "Active",
  status: "Available",
  ticketCapacity: "10",
  shiftStartTime: "09:00",
  shiftEndTime: "18:00",
};

function getInitialForm(agent) {
  if (!agent) {
    return { ...EMPTY_FORM };
  }

  return {
    employeeId:
      agent.employeeId ||
      agent.employee_id ||
      "",
    name: agent.name || "",
    username: agent.username || "",
    email: agent.email || "",
    phone: agent.phone || "",
    department:
      agent.department ||
      agent.team ||
      "Customer Support",
    role:
      agent.role ||
      agent.designation ||
      "Support Agent",
    accountStatus:
      agent.accountStatus ||
      agent.account_status ||
      "Active",
    status: agent.status || "Available",
    ticketCapacity: String(
      agent.ticketCapacity || 10,
    ),
    shiftStartTime:
      agent.shiftStartTime || "09:00",
    shiftEndTime:
      agent.shiftEndTime || "18:00",
  };
}

export default function AgentFormModal({
  open,
  mode = "create",
  agent = null,
  onClose,
  onSave,
}) {
  const [formData, setFormData] =
    useState(EMPTY_FORM);

  const [error, setError] = useState("");
  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormData(getInitialForm(agent));
    setError("");
    setSaving(false);
  }, [open, agent]);

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
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Agent name is required.");
      return;
    }

    if (!formData.email.trim()) {
      setError(
        "Agent email address is required.",
      );
      return;
    }

    if (!formData.department.trim()) {
      setError(
        "Agent department is required.",
      );
      return;
    }

    if (!formData.role.trim()) {
      setError("Agent role is required.");
      return;
    }

    if (
      Number(formData.ticketCapacity) < 1
    ) {
      setError(
        "Ticket capacity must be at least 1.",
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
          "The agent could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  const title =
    mode === "edit"
      ? "Update Agent"
      : "Add New Agent";

  return (
    <div
      className="agent-form-overlay"
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
        className="agent-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-form-title"
      >
        <header className="agent-form-header">
          <div>
            <span>Team Management</span>

            <h2 id="agent-form-title">
              {title}
            </h2>

            <p>
              Manage agent identity,
              department, availability and
              ticket capacity.
            </p>
          </div>

          <button
            type="button"
            className="agent-form-close"
            onClick={onClose}
            aria-label="Close agent form"
          >
            ×
          </button>
        </header>

        <form
          className="agent-form"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="agent-form-error">
              {error}
            </div>
          )}

          <div className="agent-form-grid">
            <div className="agent-form-field">
              <label htmlFor="agent-name">
                Full Name <span>*</span>
              </label>

              <input
                id="agent-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter agent name"
                autoFocus
              />
            </div>

            <div className="agent-form-field">
              <label htmlFor="agent-id">
                Employee ID
              </label>

              <input
                id="agent-id"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                placeholder="Generated automatically"
              />
            </div>

            <div className="agent-form-field">
              <label htmlFor="agent-email">
                Email Address <span>*</span>
              </label>

              <input
                id="agent-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="agent@servicewise.com"
              />
            </div>

            <div className="agent-form-field">
              <label htmlFor="agent-phone">
                Phone Number
              </label>

              <input
                id="agent-phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="03XX-XXXXXXX"
              />
            </div>

            <div className="agent-form-field">
              <label htmlFor="agent-username">
                Username
              </label>

              <input
                id="agent-username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Generated from email"
              />
            </div>

            <div className="agent-form-field">
              <label htmlFor="agent-department">
                Department <span>*</span>
              </label>

              <input
                id="agent-department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Customer Support"
              />
            </div>

            <div className="agent-form-field">
              <label htmlFor="agent-role">
                Role <span>*</span>
              </label>

              <select
                id="agent-role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="Support Agent">
                  Support Agent
                </option>

                <option value="Senior Support Agent">
                  Senior Support Agent
                </option>

                <option value="Supervisor">
                  Supervisor
                </option>

                <option value="Team Lead">
                  Team Lead
                </option>
              </select>
            </div>

            <div className="agent-form-field">
              <label htmlFor="agent-account-status">
                Account Status
              </label>

              <select
                id="agent-account-status"
                name="accountStatus"
                value={formData.accountStatus}
                onChange={handleChange}
              >
                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>

                <option value="Suspended">
                  Suspended
                </option>
              </select>
            </div>

            <div className="agent-form-field">
              <label htmlFor="agent-status">
                Availability
              </label>

              <select
                id="agent-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Available">
                  Available
                </option>

                <option value="Busy">
                  Busy
                </option>

                <option value="Offline">
                  Offline
                </option>
              </select>
            </div>

            <div className="agent-form-field">
              <label htmlFor="agent-capacity">
                Ticket Capacity
              </label>

              <input
                id="agent-capacity"
                name="ticketCapacity"
                type="number"
                min="1"
                max="999"
                value={formData.ticketCapacity}
                onChange={handleChange}
              />
            </div>

            <div className="agent-form-field">
              <label htmlFor="agent-shift-start">
                Shift Start
              </label>

              <input
                id="agent-shift-start"
                name="shiftStartTime"
                type="time"
                value={formData.shiftStartTime}
                onChange={handleChange}
              />
            </div>

            <div className="agent-form-field">
              <label htmlFor="agent-shift-end">
                Shift End
              </label>

              <input
                id="agent-shift-end"
                name="shiftEndTime"
                type="time"
                value={formData.shiftEndTime}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="agent-form-actions">
            <button
              type="button"
              className="agent-form-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="agent-form-save"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : mode === "edit"
                  ? "Update Agent"
                  : "Add Agent"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
