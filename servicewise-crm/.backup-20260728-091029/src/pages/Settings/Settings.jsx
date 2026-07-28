import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import authService, { listUsers, adminUpdateUser, createUser } from "../../services/authService";
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
  const { currentUser } = useAuth();
  const isAdmin = (currentUser?.role || "").toLowerCase() === "administrator" || (currentUser?.role || "").toLowerCase() === "admin";

  const [settings, setSettings] = useState(readSettings);
  const [saved, setSaved] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  // Admin user management state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [usersSuccess, setUsersSuccess] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Add User modal state
  const [showAddUser, setShowAddUser] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    username: "", role: "Support Agent", department: "Customer Support", phone: "",
  });
  const [addLoading, setAddLoading] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!saved) return undefined;
    const timeout = window.setTimeout(() => setSaved(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [saved]);

  useEffect(() => {
    if (!pwdSuccess) return undefined;
    const timeout = window.setTimeout(() => setPwdSuccess(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [pwdSuccess]);

  useEffect(() => {
    if (!usersSuccess) return undefined;
    const timeout = window.setTimeout(() => setUsersSuccess(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [usersSuccess]);

  // Load users when admin
  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
  }, [isAdmin]);

  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (error) {
      setUsersError(error.message || "Failed to load users.");
    } finally {
      setUsersLoading(false);
    }
  };

  const updateField = (event) => {
    const { name, type, checked, value } = event.target;
    setSettings((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const saveSettings = (event) => {
    event.preventDefault();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!currentPassword) {
      setPwdError("Current password is required.");
      return;
    }

    if (!newPassword) {
      setPwdError("New password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setPwdError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError("New password and confirmation do not match.");
      return;
    }

    setPwdLoading(true);

    try {
      const message = await authService.changePassword({
        email: currentUser?.email,
        currentPassword,
        newPassword,
      });

      setPwdSuccess(message || "Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPwdError(error.message || "Failed to change password.");
    } finally {
      setPwdLoading(false);
    }
  };

  // ─── Admin: Edit User ───
  const openEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      username: user.username || "",
      role: user.role || "Support Agent",
      department: user.department || "",
      phone: user.phone || "",
      employeeId: user.employeeId || "",
      newPassword: "",
    });
    setUsersError("");
    setUsersSuccess("");
  };

  const cancelEditUser = () => {
    setEditingUser(null);
    setEditForm({});
    setUsersError("");
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveUser = async () => {
    setUsersError("");
    setUsersSuccess("");
    setEditLoading(true);

    try {
      const updates = {};

      if (editForm.name !== editingUser.name) updates.name = editForm.name;
      if ((editForm.username || "") !== (editingUser.username || "")) updates.username = editForm.username || null;
      if (editForm.role !== editingUser.role) updates.role = editForm.role;
      if (editForm.department !== editingUser.department) updates.department = editForm.department;
      if (editForm.phone !== editingUser.phone) updates.phone = editForm.phone;
      if ((editForm.employeeId || "") !== (editingUser.employeeId || "")) updates.employeeId = editForm.employeeId;
      if (editForm.newPassword && editForm.newPassword.length >= 8) {
        updates.password = editForm.newPassword;
      } else if (editForm.newPassword && editForm.newPassword.length > 0 && editForm.newPassword.length < 8) {
        setUsersError("New password must be at least 8 characters long.");
        setEditLoading(false);
        return;
      }

      if (Object.keys(updates).length === 0) {
        setUsersSuccess("No changes to save.");
        setEditLoading(false);
        return;
      }

      await adminUpdateUser(editingUser.email, updates);
      setUsersSuccess(`User "${editForm.name}" updated successfully.`);
      setEditingUser(null);
      setEditForm({});
      await loadUsers();
    } catch (error) {
      setUsersError(error.message || "Failed to update user.");
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Admin: Add User ───
  const openAddUser = () => {
    setAddForm({
      name: "", email: "", password: "", confirmPassword: "",
      username: "", role: "Support Agent", department: "Customer Support", phone: "",
    });
    setUsersError("");
    setUsersSuccess("");
    setShowAddUser(true);
  };

  const cancelAddUser = () => {
    setShowAddUser(false);
    setAddForm({});
    setUsersError("");
  };

  const handleAddChange = (field, value) => {
    setAddForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = async () => {
    setUsersError("");
    setUsersSuccess("");
    setAddLoading(true);

    try {
      if (!addForm.email || !String(addForm.email).trim()) {
        setUsersError("Email is required.");
        setAddLoading(false);
        return;
      }

      if (!addForm.password || addForm.password.length < 8) {
        setUsersError("Password must be at least 8 characters long.");
        setAddLoading(false);
        return;
      }

      if (addForm.password !== addForm.confirmPassword) {
        setUsersError("Password and confirmation do not match.");
        setAddLoading(false);
        return;
      }

      const newUser = await createUser({
        name: addForm.name,
        email: addForm.email.trim(),
        password: addForm.password,
        username: addForm.username,
        role: addForm.role,
        department: addForm.department,
        phone: addForm.phone,
      });

      setUsersSuccess(`User "${newUser.name}" created successfully.`);
      setShowAddUser(false);
      setAddForm({});
      await loadUsers();
    } catch (error) {
      setUsersError(error.message || "Failed to create user.");
    } finally {
      setAddLoading(false);
    }
  };

  // ─── Admin: Delete User ───
  const confirmDeleteUser = (user) => {
    setDeleteTarget(user);
    setUsersError("");
  };

  const cancelDeleteUser = () => {
    setDeleteTarget(null);
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setUsersError("");

    try {
      await adminUpdateUser(deleteTarget.email, { name: `[DELETED]_${Date.now()}` });
      setUsersSuccess(`User "${deleteTarget.name}" has been removed.`);
      setDeleteTarget(null);
      await loadUsers();
    } catch (error) {
      setUsersError(error.message || "Failed to delete user.");
    } finally {
      setDeleteLoading(false);
    }
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

      {/* ─── General Settings ─── */}
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

      {/* ─── Change Password ─── */}
      <form className="settings-panel" onSubmit={handleChangePassword}>
        <div className="settings-section-heading">
          <h3>Change password</h3>
          <p>Update your account password. Passwords are stored securely on the server (not in the browser).</p>
        </div>

        {pwdError && (
          <div className="settings-alert settings-alert-error" role="alert">
            <strong>Password change failed</strong>
            <span>{pwdError}</span>
          </div>
        )}

        {pwdSuccess && (
          <div className="settings-alert settings-alert-success" role="status">
            <strong>Success</strong>
            <span>{pwdSuccess}</span>
          </div>
        )}

        <div className="settings-pwd-grid">
          <label htmlFor="pwd-current">
            Current password
            <div className="settings-pwd-wrap">
              <input
                id="pwd-current"
                type={showCurrentPwd ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                disabled={pwdLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="settings-pwd-toggle"
                onClick={() => setShowCurrentPwd((v) => !v)}
                tabIndex={-1}
              >
                {showCurrentPwd ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <label htmlFor="pwd-new">
            New password
            <div className="settings-pwd-wrap">
              <input
                id="pwd-new"
                type={showNewPwd ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                disabled={pwdLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="settings-pwd-toggle"
                onClick={() => setShowNewPwd((v) => !v)}
                tabIndex={-1}
              >
                {showNewPwd ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <label htmlFor="pwd-confirm">
            Confirm new password
            <input
              id="pwd-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              disabled={pwdLoading}
              autoComplete="new-password"
            />
          </label>
        </div>

        <div className="settings-actions">
          <button
            type="submit"
            className="crm-primary-button"
            disabled={pwdLoading}
          >
            {pwdLoading ? "Updating…" : "Update password"}
          </button>
        </div>
      </form>

      {/* ─── Admin: User Management ─── */}
      {isAdmin && (
        <div className="settings-panel">
          <div className="settings-section-heading settings-section-heading--row">
            <div className="settings-section-heading__text">
              <h3>User Management</h3>
              <p>View, create, edit, and manage all user accounts.</p>
            </div>
            <button
              type="button"
              className="settings-users-add-btn"
              onClick={openAddUser}
            >
              + Add User
            </button>
          </div>

          {usersError && (
            <div className="settings-alert settings-alert-error" role="alert">
              <strong>Error</strong>
              <span>{usersError}</span>
            </div>
          )}

          {usersSuccess && (
            <div className="settings-alert settings-alert-success" role="status">
              <strong>Success</strong>
              <span>{usersSuccess}</span>
            </div>
          )}

          <div className="settings-users-table-wrap">
            {usersLoading ? (
              <div className="settings-users-loading">Loading users…</div>
            ) : (
              <table className="settings-users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.email}>
                      <td>
                        <div className="settings-users-name">
                          <span className="settings-users-avatar">
                            {(user.name || user.email || "?").charAt(0).toUpperCase()}
                          </span>
                          {user.name}
                        </div>
                      </td>
                      <td className="settings-users-email">{user.email}</td>
                      <td>{user.username || "—"}</td>
                      <td>
                        <span className={`settings-users-role settings-users-role--${(user.role || "").toLowerCase().replace(/\s+/g, "-")}`}>
                          {user.role || "Agent"}
                        </span>
                      </td>
                      <td>{user.department || "—"}</td>
                      <td>{user.phone || "—"}</td>
                      <td>
                        <div className="settings-users-actions">
                          <button
                            className="settings-users-edit-btn"
                            onClick={() => openEditUser(user)}
                            disabled={editingUser?.email === user.email}
                          >
                            Edit
                          </button>
                          <button
                            className="settings-users-delete-btn"
                            onClick={() => confirmDeleteUser(user)}
                            disabled={deleteLoading}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={7} className="settings-users-empty">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* ─── Add User Modal ─── */}
          {showAddUser && (
            <div className="settings-users-modal-overlay" onClick={cancelAddUser}>
              <div className="settings-users-modal" onClick={(e) => e.stopPropagation()}>
                <div className="settings-users-modal-header">
                  <h4>Add New User</h4>
                  <button className="settings-users-modal-close" onClick={cancelAddUser}>&times;</button>
                </div>

                <div className="settings-users-modal-body">
                  <div className="settings-users-modal-grid">
                    <label>
                      Full Name <span className="settings-required">*</span>
                      <input
                        type="text"
                        value={addForm.name}
                        onChange={(e) => handleAddChange("name", e.target.value)}
                        placeholder="Enter full name"
                      />
                    </label>

                    <label>
                      Email <span className="settings-required">*</span>
                      <input
                        type="email"
                        value={addForm.email}
                        onChange={(e) => handleAddChange("email", e.target.value)}
                        placeholder="user@servicewise.com"
                      />
                    </label>

                    <label>
                      Username
                      <input
                        type="text"
                        value={addForm.username}
                        onChange={(e) => handleAddChange("username", e.target.value)}
                        placeholder="e.g. jsmith"
                      />
                    </label>

                    <label>
                      Role
                      <select
                        value={addForm.role}
                        onChange={(e) => handleAddChange("role", e.target.value)}
                      >
                        <option value="Administrator">Administrator</option>
                        <option value="Senior Agent">Senior Agent</option>
                        <option value="Support Agent">Support Agent</option>
                        <option value="Manager">Manager</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </label>

                    <label>
                      Department
                      <input
                        type="text"
                        value={addForm.department}
                        onChange={(e) => handleAddChange("department", e.target.value)}
                        placeholder="e.g. Customer Support"
                      />
                    </label>

                    <label>
                      Phone
                      <input
                        type="tel"
                        value={addForm.phone}
                        onChange={(e) => handleAddChange("phone", e.target.value)}
                        placeholder="e.g. 03000000000"
                      />
                    </label>
                  </div>

                  <div className="settings-users-modal-pwd-section">
                    <div className="settings-users-modal-grid">
                      <label>
                        Password <span className="settings-required">*</span>
                        <input
                          type="password"
                          value={addForm.password}
                          onChange={(e) => handleAddChange("password", e.target.value)}
                          placeholder="Min 8 characters"
                          autoComplete="new-password"
                        />
                      </label>

                      <label>
                        Confirm Password <span className="settings-required">*</span>
                        <input
                          type="password"
                          value={addForm.confirmPassword}
                          onChange={(e) => handleAddChange("confirmPassword", e.target.value)}
                          placeholder="Re-enter password"
                          autoComplete="new-password"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="settings-users-modal-footer">
                  <button className="settings-users-modal-btn settings-users-modal-btn--cancel" onClick={cancelAddUser}>
                    Cancel
                  </button>
                  <button
                    className="settings-users-modal-btn settings-users-modal-btn--save"
                    onClick={handleCreateUser}
                    disabled={addLoading}
                  >
                    {addLoading ? "Creating…" : "Create User"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Edit User Modal ─── */}
          {editingUser && (
            <div className="settings-users-modal-overlay" onClick={cancelEditUser}>
              <div className="settings-users-modal" onClick={(e) => e.stopPropagation()}>
                <div className="settings-users-modal-header">
                  <h4>Edit User</h4>
                  <button className="settings-users-modal-close" onClick={cancelEditUser}>&times;</button>
                </div>

                <div className="settings-users-modal-body">
                  <div className="settings-users-modal-info">
                    <span className="settings-users-modal-label">Email</span>
                    <span className="settings-users-modal-value">{editingUser.email}</span>
                  </div>

                  <div className="settings-users-modal-grid">
                    <label>
                      Full Name
                      <input
                        type="text"
                        value={editForm.name || ""}
                        onChange={(e) => handleEditChange("name", e.target.value)}
                        placeholder="Enter full name"
                      />
                    </label>

                    <label>
                      Username
                      <input
                        type="text"
                        value={editForm.username || ""}
                        onChange={(e) => handleEditChange("username", e.target.value)}
                        placeholder="e.g. jsmith"
                      />
                    </label>

                    <label>
                      Role
                      <select
                        value={editForm.role || ""}
                        onChange={(e) => handleEditChange("role", e.target.value)}
                      >
                        <option value="Administrator">Administrator</option>
                        <option value="Senior Agent">Senior Agent</option>
                        <option value="Support Agent">Support Agent</option>
                        <option value="Manager">Manager</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </label>

                    <label>
                      Employee ID
                      <input
                        type="text"
                        value={editForm.employeeId || ""}
                        onChange={(e) => handleEditChange("employeeId", e.target.value)}
                        placeholder="e.g. EMP008"
                      />
                    </label>

                    <label>
                      Department
                      <input
                        type="text"
                        value={editForm.department || ""}
                        onChange={(e) => handleEditChange("department", e.target.value)}
                        placeholder="Enter department"
                      />
                    </label>

                    <label>
                      Phone
                      <input
                        type="tel"
                        value={editForm.phone || ""}
                        onChange={(e) => handleEditChange("phone", e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </label>
                  </div>

                  <div className="settings-users-modal-pwd-section">
                    <label>
                      Reset Password (leave blank to keep current)
                      <input
                        type="password"
                        value={editForm.newPassword || ""}
                        onChange={(e) => handleEditChange("newPassword", e.target.value)}
                        placeholder="Enter new password (min 8 chars)"
                        autoComplete="new-password"
                      />
                    </label>
                  </div>
                </div>

                <div className="settings-users-modal-footer">
                  <button className="settings-users-modal-btn settings-users-modal-btn--cancel" onClick={cancelEditUser}>
                    Cancel
                  </button>
                  <button
                    className="settings-users-modal-btn settings-users-modal-btn--save"
                    onClick={handleSaveUser}
                    disabled={editLoading}
                  >
                    {editLoading ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Delete Confirmation Modal ─── */}
          {deleteTarget && (
            <div className="settings-users-modal-overlay" onClick={cancelDeleteUser}>
              <div className="settings-users-modal settings-users-modal--sm" onClick={(e) => e.stopPropagation()}>
                <div className="settings-users-modal-header">
                  <h4>Confirm Delete</h4>
                  <button className="settings-users-modal-close" onClick={cancelDeleteUser}>&times;</button>
                </div>
                <div className="settings-users-modal-body">
                  <p className="settings-delete-text">
                    Are you sure you want to remove <strong>{deleteTarget.name}</strong> ({deleteTarget.email})?
                    This action will mark the account as deleted.
                  </p>
                </div>
                <div className="settings-users-modal-footer">
                  <button className="settings-users-modal-btn settings-users-modal-btn--cancel" onClick={cancelDeleteUser}>
                    Cancel
                  </button>
                  <button
                    className="settings-users-modal-btn settings-users-modal-btn--delete"
                    onClick={handleDeleteUser}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? "Deleting…" : "Delete User"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
