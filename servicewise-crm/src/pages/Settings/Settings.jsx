import { useEffect, useState } from "react";
import "./Settings.css";

const STORAGE_KEY = "servicewise_workspace_settings";

const defaultSettings = {
  organizationName: "ServiceWise CRM",
  supportEmail: "support@servicewise.com",
  defaultDepartment: "Customer Support",
  defaultPriority: "Medium",
  defaultSlaHours: "8",
  autoAssign: false,
  emailNotifications: true,
  whatsappNotifications: true,
};

function readSettings() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export default function Settings() {
  const [settings, setSettings] = useState(readSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return undefined;
    const timeout = window.setTimeout(() => setSaved(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [saved]);

  const updateField = (event) => {
    const { name, type, checked, value } = event.target;
    setSettings((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const saveSettings = (event) => {
    event.preventDefault();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
  };

  return (
    <section className="crm-page-container settings-page">
      <div className="settings-page__header">
        <div>
          <p className="page-eyebrow">WORKSPACE CONFIGURATION</p>
          <h2>Settings</h2>
          <p>Recovered local workspace preferences. Secret keys are not displayed or stored here.</p>
        </div>
      </div>

      <form className="settings-panel" onSubmit={saveSettings}>
        <div className="settings-section-heading">
          <h3>General settings</h3>
          <p>These settings are saved in this browser until the administration database is restored.</p>
        </div>

        <div className="settings-grid">
          <label>Organization name<input name="organizationName" value={settings.organizationName} onChange={updateField} /></label>
          <label>Support email<input type="email" name="supportEmail" value={settings.supportEmail} onChange={updateField} /></label>
          <label>Default department<input name="defaultDepartment" value={settings.defaultDepartment} onChange={updateField} /></label>
          <label>Default priority<select name="defaultPriority" value={settings.defaultPriority} onChange={updateField}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
          <label>Default SLA hours<input type="number" min="1" name="defaultSlaHours" value={settings.defaultSlaHours} onChange={updateField} /></label>
        </div>

        <div className="settings-toggle-list">
          <label><input type="checkbox" name="autoAssign" checked={settings.autoAssign} onChange={updateField} /><span><strong>Automatic assignment</strong><small>Assign new tickets automatically when the assignment engine is available.</small></span></label>
          <label><input type="checkbox" name="emailNotifications" checked={settings.emailNotifications} onChange={updateField} /><span><strong>Email notifications</strong><small>Allow ticket email notification workflows.</small></span></label>
          <label><input type="checkbox" name="whatsappNotifications" checked={settings.whatsappNotifications} onChange={updateField} /><span><strong>WhatsApp notifications</strong><small>Allow WhatsApp inbox notification workflows.</small></span></label>
        </div>

        <div className="settings-actions">
          {saved && <span className="save-success">Settings saved locally.</span>}
          <button type="submit" className="crm-primary-button">Save settings</button>
        </div>
      </form>
    </section>
  );
}
