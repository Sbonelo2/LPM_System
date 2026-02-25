import React, { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import TableComponent from "../components/TableComponent";
import Card from "../components/Card";
import Modal from "../components/Modal"; // Import Modal
import Snackbar from "../components/Snackbar"; // Import Snackbar
import InputField from "../components/InputField"; // Import InputField
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
  { label: "Programme Coordinator", value: "programme_coordinator" },
  { label: "QA Officer", value: "qa_officer" },
  { label: "Learner", value: "learner" },
];

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
};

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newFullName, setNewFullName] = useState<string>("");
  const [newEmail, setNewEmail] = useState<string>("");
  const [newRole, setNewRole] = useState<string>("");
  const [addUserError, setAddUserError] = useState<string>("");
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false); // State for edit modal
  const [userToEdit, setUserToEdit] = useState<User | null>(null); // State for user to edit
  const [editedFullName, setEditedFullName] = useState<string>("");
  const [editedEmail, setEditedEmail] = useState<string>("");
  const [editedRole, setEditedRole] = useState<string>("");
  const [editedActive, setEditedActive] = useState<boolean>(true);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, is_active, created_at")
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setUsers([]);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as ProfileRow[];
    setUsers(
      rows.map((row) => ({
        id: row.id,
        fullName: row.full_name ?? "",
        email: row.email ?? "",
        role: row.role,
        createdDate: row.created_at ? row.created_at.slice(0, 10) : "",
        isActive: row.is_active,
      })),
    );
    setLoading(false);
  };

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

  const handleSaveNewUser = () => {
    const trimmedFullName = newFullName.trim();
    const trimmedEmail = newEmail.trim();
    const trimmedRole = newRole.trim();

    if (!trimmedFullName || !trimmedEmail || !trimmedRole) {
      setAddUserError("Please fill in Full Name, Email, and Role.");
      return;
    }

    const emailExists = users.some(
      (user) => user.email.toLowerCase() === trimmedEmail.toLowerCase(),
    );
    if (emailExists) {
      setAddUserError("A user with this email already exists.");
      return;
    }

    setAddUserError(
      "User creation must be done in Supabase Authentication. After creating the user, run the profiles backfill SQL (or sign in once) and refresh this page.",
    );
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
    if (!userToEdit) {
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: editedFullName,
        email: editedEmail,
        role: editedRole,
        is_active: editedActive,
      })
      .eq("id", userToEdit.id);

    if (updateError) {
      showSnackbar(`Update failed: ${updateError.message}`);
      return;
    }

    showSnackbar(`User ${editedFullName} updated successfully!`);
    setUserToEdit(null);
    setShowEditModal(false);
    fetchUsers();
  };

  const cancelEdit = () => {
    setUserToEdit(null);
    setShowEditModal(false);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!userToDelete) return;
    void (async () => {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ is_active: false })
        .eq("id", userToDelete.id);

      if (updateError) {
        showSnackbar(`Deactivate failed: ${updateError.message}`);
        return;
      }

      showSnackbar(`User ${userToDelete.fullName} deactivated.`);
      setUserToDelete(null);
      setShowDeleteModal(false);
      fetchUsers();
    })();
  };

  const cancelDelete = () => {
    setUserToDelete(null);
    setShowDeleteModal(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => users, [users]);

  const userColumns: TableColumn<User>[] = [
    { key: "fullName", header: "Full Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    { key: "createdDate", header: "Created Date" },
    {
      key: "isActive",
      header: "Status",
      render: (user: User) => (user.isActive ? "Active" : "Inactive"),
    },
    {
      key: "actions",
      header: "Actions",
      render: (user: User) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <span
            onClick={() => handleEditUser(user)}
            style={{
              cursor: "pointer",
              color: "var(--primary-color)",
              fontSize: "1.2em",
            }}
            title="Edit User"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83l3.75 3.75M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z"
              />
            </svg>
          </span>
          <span
            onClick={() => handleDeleteUser(user)}
            style={{
              cursor: "pointer",
              color: "var(--secondary-color)",
              fontSize: "1.2em",
            }}
            title="Deactivate User"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12l1.41 1.41L13.41 14l2.12 2.12l-1.41 1.41L12 15.41l-2.12 2.12l-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"
              />
            </svg>
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-layout">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>USER MANAGEMENT</h2>
          <Button text="Add User" onClick={handleAddUser} variant="primary" />
        </div>

        <Card>
          <h3>Users</h3>
          {loading ? (
            <LoadingSpinner message="Loading users..." />
          ) : (
            <>
              {error && (
                <p style={{ marginTop: 12, color: "var(--secondary-color)" }}>
                  {error}
                </p>
              )}
              <TableComponent
                columns={userColumns}
                data={filteredUsers}
                caption="Manage System Users"
              />
            </>
          )}
        </Card>

        {showDeleteModal && (
          <Modal
            isOpen={showDeleteModal}
            onClose={cancelDelete}
            title="Confirm Deletion"
          >
            <p>
              Are you sure you want to deactivate user:{" "}
              <strong>{userToDelete?.fullName}</strong>?
            </p>
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
                onClick={cancelDelete}
                variant="secondary"
              />
              <Button
                text="Deactivate"
                onClick={confirmDelete}
                variant="primary"
              />
            </div>
          </Modal>
        )}

        {showAddModal && (
          <Modal
            isOpen={showAddModal}
            onClose={closeAddModal}
            title="Add New User"
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <InputField
                label="Full Name"
                value={newFullName}
                onChange={setNewFullName}
                required
              />
              <InputField
                label="Email"
                value={newEmail}
                onChange={setNewEmail}
                type="email"
                required
              />
              <Dropdown
                label="Role"
                value={newRole}
                onChange={setNewRole}
                options={ROLE_OPTIONS}
                placeholder="Select role"
                required
              />
              {addUserError && (
                <p style={{ margin: 0, color: "var(--secondary-color)" }}>
                  {addUserError}
                </p>
              )}
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
                  onClick={closeAddModal}
                  variant="secondary"
                />
                <Button
                  text="Save User"
                  onClick={handleSaveNewUser}
                  variant="primary"
                />
              </div>
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
              <Dropdown
                label="Status"
                value={editedActive ? "active" : "inactive"}
                onChange={(value) => setEditedActive(value === "active")}
                options={[
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ]}
                placeholder="Select status"
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
