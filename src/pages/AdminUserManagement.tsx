import React, { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import TableComponent from "../components/TableComponent";
import Card from "../components/Card";
import Modal from "../components/Modal"; 
import Snackbar from "../components/Snackbar"; 
import InputField from "../components/InputField"; 
import Dropdown, { type DropdownOption } from "../components/Dropdown";
import { type TableColumn } from "../components/TableComponent";
import LoadingSpinner from "../components/LoadingSpinner";
import { supabase } from "../services/supabaseClient";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdDate: string;
  isActive: boolean;
}

const ROLE_OPTIONS: DropdownOption[] = [
  { label: "Admin", value: "admin" },
  { label: "Super Admin", value: "super_admin" },
  { label: "Facilitator", value: "facilitator" },
  { label: "Learner", value: "learner" },
  { label: "Mentor", value: "mentor" },
  { label: "Programme Coordinator", value: "programme_coordinator" },
];

const generateSystemPassword = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  let result = "";
  for (let i = 0; i < 12; i += 1) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
};

type GeneratedCredentials = {
  fullName: string;
  email: string;
  role: string;
  password: string;
};

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newFullName, setNewFullName] = useState<string>("");
  const [newEmail, setNewEmail] = useState<string>("");
  const [newRole, setNewRole] = useState<string>("");
  const [addUserError, setAddUserError] = useState<string>("");
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedCredentials | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editedFullName, setEditedFullName] = useState<string>("");
  const [editedEmail, setEditedEmail] = useState<string>("");
  const [editedRole, setEditedRole] = useState<string>("");
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedUsers User[] = (data || []).map((u: any) => ({
        id: u.id,
        fullName: u.full_name || "N/A",
        email: u.email || "N/A",
        role: u.role || "learner",
        createdDate: new Date(u.created_at).toISOString().split("T")[0],
      }));

      setUsers(formattedUsers);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      showSnackbar(`Failed to load users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const withTimeout = async <T,>(
    promise: PromiseLike<T>,
    ms: number,
    label: string,
  ): Promise<T> => {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_resolve, reject) =>
        setTimeout(() => reject(new Error(`${label} timed out`)), ms),
      ),
    ]);
  };

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const { data, error: supaError } = (await withTimeout(
          supabase
            .from("profiles")
            .select("id, full_name, email, role, is_active, created_at")
            .order("created_at", { ascending: false }),
          10000,
          "Load users",
        )) as {
          data:
            | {
                id: string;
                full_name: string | null;
                email: string | null;
                role: string;
                is_active: boolean | null;
                created_at: string;
              }[]
            | null;
          error: { message: string } | null;
        };

        if (supaError) {
          throw new Error(supaError.message);
        }

        setUsers(
          (data ?? []).map((row) => ({
            id: row.id,
            fullName: row.full_name ?? "",
            email: row.email ?? "",
            role: row.role ?? "",
            createdDate: row.created_at ? row.created_at.slice(0, 10) : "",
            isActive: row.is_active ?? true,
          })),
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
  };

  const handleCloseSnackbar = () => {
    setSnackbarMessage("");
  };

  const handleAddUser = () => {
    setAddUserError("");
    setNewFullName("");
    setNewEmail("");
    setNewRole("");
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddUserError("");
  };

  const handleSaveNewUser = async () => {
    const trimmedFullName = newFullName.trim();
    const trimmedEmail = newEmail.trim().toLowerCase();
    const trimmedRole = newRole.trim();

    if (!trimmedFullName || !trimmedEmail || !trimmedRole) {
      setAddUserError("Please fill in Full Name, Email, and Role.");
      return;
    }

    // Basic Email Regex for validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setAddUserError("Please enter a valid email address (e.g., user@example.com).");
      return;
    }

    setProcessing(true);
    setAddUserError("");

    try {
      const password = generateSystemPassword();
      
      // 1. Create the user in Auth
      // Note: In a production app, this should ideally be an Edge Function 
      // using the service_role key to avoid session issues.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: password,
        options: {
          data: {
            full_name: trimmedFullName,
            role: trimmedRole,
          },
          // Prevent auto-login so the Admin doesn't lose their session
          emailRedirectTo: window.location.origin,
        }
      });

      if (authError) {
        if (authError.message.includes("validate email")) {
          throw new Error("The email format is invalid. Please double-check for typos or extra spaces.");
        }
        throw authError;
      }

      if (authData.user) {
        // 2. Profiles table sync
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: authData.user.id,
          full_name: trimmedFullName,
          email: trimmedEmail,
          role: trimmedRole,
        });

        if (profileError) console.error("Profile upsert error:", profileError);

        // 3. If learner, create learner_profile
        if (trimmedRole === "learner") {
          await supabase.from("learner_profiles").upsert({
            user_id: authData.user.id,
            learner_name: trimmedFullName,
            email: trimmedEmail,
          });
        }

        setGeneratedCredentials({
          fullName: trimmedFullName,
          email: trimmedEmail,
          role: trimmedRole,
          password,
        });

        showSnackbar(`User ${trimmedFullName} account created!`);
        fetchUsers(); // Refresh list
      }
    } catch (err: any) {
      console.error("Error creating user:", err);
      setAddUserError(err.message || "Failed to create user.");
    } finally {
      setProcessing(false);
    }
  };

  const copyGeneratedCredentials = async () => {
    if (!generatedCredentials) return;
    const message = `Name: ${generatedCredentials.fullName}\nEmail: ${generatedCredentials.email}\nRole: ${generatedCredentials.role}\nTemporary Password: ${generatedCredentials.password}`;
    try {
      await navigator.clipboard.writeText(message);
      showSnackbar("Credentials copied to clipboard.");
    } catch (error) {
      showSnackbar("Unable to copy credentials.");
    }
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setEditedFullName(user.fullName);
    setEditedEmail(user.email);
    setEditedRole(user.role);
    setEditedActive(user.isActive);
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (userToEdit) {
      setProcessing(true);
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: editedFullName,
            role: editedRole,
          })
          .eq("id", userToEdit.id);

        if (error) throw error;

        showSnackbar(`User ${editedFullName} updated successfully!`);
        fetchUsers();
        setShowEditModal(false);
      } catch (err: any) {
        showSnackbar(`Failed to update user: ${err.message}`);
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      setProcessing(true);
      try {
        // Note: auth.users can only be deleted via admin API
        // We delete from profiles, and hopefully have a trigger or just leave auth user
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", userToDelete.id);

        if (error) throw error;

        showSnackbar(`User record ${userToDelete.fullName} removed.`);
        fetchUsers();
        setShowDeleteModal(false);
      } catch (err: any) {
        showSnackbar(`Failed to delete user: ${err.message}`);
      } finally {
        setProcessing(false);
      }
    }
  };

  const userColumns: TableColumn<User>[] = [
    { key: "fullName", header: "Full Name" },
    { key: "email", header: "Email" },
    { 
      key: "role", 
      header: "Role",
      render: (u: User) => u.role.replace("_", " ").toUpperCase()
    },
    { key: "createdDate", header: "Created Date" },
    {
      key: "actions",
      header: "Actions",
      render: (user: User) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <span
            onClick={() => handleEditUser(user)}
            style={{ cursor: "pointer", color: "var(--primary-color)", fontSize: "1.2em" }}
            title="Edit User"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
              <path fill="currentColor" d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83l3.75 3.75M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z" />
            </svg>
          </span>
          <span
            onClick={() => handleDeleteUser(user)}
            style={{ cursor: "pointer", color: "var(--secondary-color)", fontSize: "1.2em" }}
            title="Delete User"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
              <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12l1.41 1.41L13.41 14l2.12 2.12l-1.41 1.41L12 15.41l-2.12 2.12l-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <h2 className="dashboard-title">User Management</h2>

      <Card>
        <h3>Users</h3>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}><LoadingSpinner /></div>
        ) : (
          <TableComponent
            columns={userColumns}
            data={users}
            caption="Manage System Users and Roles"
          />
        )}
      </Card>

      {showDeleteModal && (
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Deletion">
          <p>Are you sure you want to remove the record for: <strong>{userToDelete?.fullName}</strong>?</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
            <Button text="Cancel" onClick={() => setShowDeleteModal(false)} variant="secondary" />
            <Button text={processing ? "Deleting..." : "Delete Record"} onClick={confirmDelete} variant="primary" disabled={processing} />
          </div>
        </Modal>
      )}

      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={closeAddModal} title="Add New User">
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <InputField label="Full Name" value={newFullName} onChange={setNewFullName} required disabled={processing} />
            <InputField label="Email" value={newEmail} onChange={setNewEmail} type="email" required disabled={processing} />
            <Dropdown label="Role" value={newRole} onChange={setNewRole} options={ROLE_OPTIONS} placeholder="Select role" required disabled={processing} />
            
            {addUserError && <p style={{ margin: 0, color: "var(--secondary-color)" }}>{addUserError}</p>}
            
            {generatedCredentials && (
              <div style={{ border: "1px solid #d6d6d6", borderRadius: "8px", padding: "12px", background: "#f8f8f8", display: "flex", flexDirection: "column", gap: "8px" }}>
                <strong>System generated credentials</strong>
                <span><strong>Email:</strong> {generatedCredentials.email}</span>
                <span><strong>Role:</strong> {generatedCredentials.role.toUpperCase()}</span>
                <span style={{ fontFamily: "monospace" }}><strong>Temporary Password:</strong> {generatedCredentials.password}</span>
                <span style={{ fontSize: "0.9rem" }}>Share these credentials with the user. They have been saved to the system.</span>
                <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                  <Button text="Copy Credentials" onClick={copyGeneratedCredentials} variant="secondary" />
                </div>
              </div>
            )}
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <Button text="Cancel" onClick={closeAddModal} variant="secondary" />
              {!generatedCredentials && (
                <Button text={processing ? "Creating..." : "Save User"} onClick={handleSaveNewUser} variant="primary" disabled={processing} />
              )}
              {generatedCredentials && (
                <Button text="Done" onClick={closeAddModal} variant="primary" />
              )}
            </div>
          </Modal>
        )}

      {showEditModal && userToEdit && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Edit User: ${userToEdit.fullName}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <InputField label="Full Name" value={editedFullName} onChange={setEditedFullName} disabled={processing} />
            <InputField label="Email" value={editedEmail} onChange={setEditedEmail} type="email" disabled={true} />
            <Dropdown label="Role" value={editedRole} onChange={setEditedRole} options={ROLE_OPTIONS} placeholder="Select role" disabled={processing} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <Button text="Cancel" onClick={() => setShowEditModal(false)} variant="secondary" />
              <Button text={processing ? "Saving..." : "Save"} onClick={handleSaveUser} variant="primary" disabled={processing} />
            </div>
          </Modal>
        )}

        {showEditModal && userToEdit && (
          <Modal
            isOpen={showEditModal}
            onClose={cancelEdit}
            title={`Edit User: ${userToEdit.fullName}`}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <InputField
                label="Full Name"
                value={editedFullName}
                onChange={setEditedFullName}
              />
              <InputField
                label="Email"
                value={editedEmail}
                onChange={setEditedEmail}
                type="email"
              />
              <Dropdown
                label="Role"
                value={editedRole}
                onChange={setEditedRole}
                options={ROLE_OPTIONS}
                placeholder="Select role"
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <Button
                  text="Cancel"
                  onClick={cancelEdit}
                  variant="secondary"
                />
                <Button
                  text="Save"
                  onClick={handleSaveUser}
                  variant="primary"
                />
              </div>
            </div>
          </Modal>
        )}

        <Snackbar message={snackbarMessage} onClose={handleCloseSnackbar} />
      </div>
    </div>
  );
};

export default AdminUserManagement;
