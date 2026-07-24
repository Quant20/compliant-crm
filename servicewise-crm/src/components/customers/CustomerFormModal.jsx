import { useEffect, useState } from "react";

import "./CustomerFormModal.css";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  cnic: "",
  walletId: "",
  retailerId: "",
  city: "",
  address: "",
  accountStatus: "Active",
  riskLevel: "Normal",
  preferredChannel: "Phone",
  notes: "",
};

function getInitialForm(customer) {
  if (!customer) {
    return { ...EMPTY_FORM };
  }

  return {
    name: customer.name || "",
    email: customer.email || "",
    phone: customer.phone || "",
    cnic:
      customer.cnic === "Not available"
        ? ""
        : customer.cnic || "",
    walletId:
      customer.walletId === "Not available"
        ? ""
        : customer.walletId || "",
    retailerId:
      customer.retailerId === "Not available"
        ? ""
        : customer.retailerId || "",
    city:
      customer.city === "Not available"
        ? ""
        : customer.city || "",
    address: customer.address || "",
    accountStatus:
      customer.accountStatus || "Active",
    riskLevel:
      customer.riskLevel || "Normal",
    preferredChannel:
      customer.preferredChannel || "Phone",
    notes: customer.notes || "",
  };
}

export default function CustomerFormModal({
  open,
  mode = "create",
  customer = null,
  onClose,
  onSave,
}) {
  const [formData, setFormData] =
    useState(EMPTY_FORM);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormData(getInitialForm(customer));
    setError("");
    setSaving(false);
  }, [open, customer]);

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

    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.name.trim()) {
      setError("Customer name is required.");
      return;
    }

    if (
      !formData.email.trim() &&
      !formData.phone.trim()
    ) {
      setError(
        "Enter at least an email address or phone number.",
      );
      return;
    }

    try {
      setSaving(true);

      await Promise.resolve(onSave(formData));

      onClose();
    } catch (saveError) {
      setError(
        saveError?.message ||
          "The customer could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  const title =
    mode === "edit"
      ? "Edit Customer"
      : "Add New Customer";

  return (
    <div
      className="customer-form-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="customer-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-form-title"
      >
        <header className="customer-form-header">
          <div>
            <span>Customer Management</span>

            <h2 id="customer-form-title">
              {title}
            </h2>

            <p>
              Store customer details for complaints,
              tickets and future interactions.
            </p>
          </div>

          <button
            type="button"
            className="customer-form-close"
            onClick={onClose}
            aria-label="Close customer form"
          >
            ×
          </button>
        </header>

        <form
          className="customer-form"
          onSubmit={handleSubmit}
        >
          {mode === "edit" &&
            customer?.customerId &&
            customer.customerId !==
              "Not available" && (
              <div className="customer-number-box">
                <span>Customer ID</span>

                <strong>
                  {customer.customerId}
                </strong>
              </div>
            )}

          {error && (
            <div className="customer-form-error">
              {error}
            </div>
          )}

          <div className="customer-form-grid">
            <div className="customer-field customer-field-full">
              <label htmlFor="customer-name">
                Customer Name
                <span>*</span>
              </label>

              <input
                id="customer-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full customer name"
                autoFocus
              />
            </div>

            <div className="customer-field">
              <label htmlFor="customer-email">
                Email Address
              </label>

              <input
                id="customer-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="customer@example.com"
              />
            </div>

            <div className="customer-field">
              <label htmlFor="customer-phone">
                Phone Number
              </label>

              <input
                id="customer-phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="03XX-XXXXXXX"
              />
            </div>

            <div className="customer-field">
              <label htmlFor="customer-cnic">
                CNIC
              </label>

              <input
                id="customer-cnic"
                name="cnic"
                value={formData.cnic}
                onChange={handleChange}
                placeholder="XXXXX-XXXXXXX-X"
              />
            </div>

            <div className="customer-field">
              <label htmlFor="customer-city">
                City
              </label>

              <input
                id="customer-city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Karachi"
              />
            </div>

            <div className="customer-field">
              <label htmlFor="customer-wallet">
                Wallet ID
              </label>

              <input
                id="customer-wallet"
                name="walletId"
                value={formData.walletId}
                onChange={handleChange}
                placeholder="Wallet reference"
              />
            </div>

            <div className="customer-field">
              <label htmlFor="customer-retailer">
                Retailer ID
              </label>

              <input
                id="customer-retailer"
                name="retailerId"
                value={formData.retailerId}
                onChange={handleChange}
                placeholder="Retailer reference"
              />
            </div>

            <div className="customer-field">
              <label htmlFor="customer-status">
                Account Status
              </label>

              <select
                id="customer-status"
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

                <option value="Blocked">
                  Blocked
                </option>

                <option value="Suspended">
                  Suspended
                </option>

                <option value="Under Review">
                  Under Review
                </option>
              </select>
            </div>

            <div className="customer-field">
              <label htmlFor="customer-risk">
                Risk Level
              </label>

              <select
                id="customer-risk"
                name="riskLevel"
                value={formData.riskLevel}
                onChange={handleChange}
              >
                <option value="Normal">
                  Normal
                </option>

                <option value="Low">
                  Low
                </option>

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

            <div className="customer-field">
              <label htmlFor="customer-channel">
                Preferred Channel
              </label>

              <select
                id="customer-channel"
                name="preferredChannel"
                value={formData.preferredChannel}
                onChange={handleChange}
              >
                <option value="Phone">
                  Phone
                </option>

                <option value="Email">
                  Email
                </option>

                <option value="WhatsApp">
                  WhatsApp
                </option>

                <option value="SMS">
                  SMS
                </option>

                <option value="Portal">
                  Customer Portal
                </option>
              </select>
            </div>

            <div className="customer-field customer-field-full">
              <label htmlFor="customer-address">
                Address
              </label>

              <textarea
                id="customer-address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Customer address"
                rows="2"
              />
            </div>

            <div className="customer-field customer-field-full">
              <label htmlFor="customer-notes">
                Customer Notes
              </label>

              <textarea
                id="customer-notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Important customer information visible to support staff"
                rows="3"
              />
            </div>
          </div>

          <footer className="customer-form-actions">
            <button
              type="button"
              className="customer-form-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="customer-form-save"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : mode === "edit"
                  ? "Save Changes"
                  : "Create Customer"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
