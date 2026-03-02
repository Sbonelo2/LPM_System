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
  { label: "Admin", value: "Admin" },
  { label: "Super Admin", value: "Super Admin" },
  { label: "Facilitator", value: "Facilitator" },
  { label: "Learner", value: "Learner" },
];

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
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

  const handleSaveNewUser = () => {
    setAddUserError(
      "Creating auth users must be done in Supabase Authentication. This screen manages existing profiles.",
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

    try {
      const { error: updateError } = (await withTimeout(
        supabase
          .from("profiles")
          .update({
            full_name: editedFullName,
            email: editedEmail,
            role: editedRole,
            is_active: editedActive,
          })
          .eq("id", userToEdit.id),
        10000,
        "Update user",
      )) as { error: { message: string } | null };

      if (updateError) {
        throw new Error(updateError.message);
      }

      const updatedUser: User = {
        ...userToEdit,
        fullName: editedFullName,
        email: editedEmail,
        role: editedRole,
        isActive: editedActive,
      };

      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
      );
      showSnackbar(`User ${updatedUser.fullName} updated successfully!`);
      setUserToEdit(null);
      setShowEditModal(false);
    } catch (e: unknown) {
      showSnackbar(e instanceof Error ? e.message : "Failed to update user");
    }
  };

  const cancelEdit = () => {
    setUserToEdit(null);
    setShowEditModal(false);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) {
      return;
    }

    try {
      const { error: updateError } = (await withTimeout(
        supabase
          .from("profiles")
          .update({ is_active: false })
          .eq("id", userToDelete.id),
        10000,
        "Deactivate user",
      )) as { error: { message: string } | null };

      if (updateError) {
        throw new Error(updateError.message);
      }

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === userToDelete.id ? { ...u, isActive: false } : u,
        ),
      );
      showSnackbar(`User ${userToDelete.fullName} deactivated.`);
      setUserToDelete(null);
      setShowDeleteModal(false);
    } catch (e: unknown) {
      showSnackbar(e instanceof Error ? e.message : "Failed to deactivate");
    }
  };

  const cancelDelete = () => {
    setUserToDelete(null);
    setShowDeleteModal(false);
  };

  const userColumns: TableColumn<User>[] = [
    { key: "fullName", header: "Full Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    { key: "createdDate", header: "Created Date" },
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
            title="Delete User"
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
    <div className="dashboard-container">
      <div className="dashboard-content">
        <h2 className="dashboard-title">User Management</h2>

        {loading ? <LoadingSpinner /> : null}
        {error ? (
          <div style={{ color: "#dc3545", padding: "8px 0" }}>{error}</div>
        ) : null}

        <div className="dashboard-actions">
          <Button text="Add User" onClick={handleAddUser} />
        </div>

        <Card>
          <h3>Users</h3>
          <TableComponent
            columns={userColumns}
            data={users}
            caption="Manage System Users and Roles"
          />
        </Card>

        {showDeleteModal && (
          <Modal
            isOpen={showDeleteModal}
            onClose={cancelDelete}
            title="Confirm Deletion"
          >
            <p>
              Are you sure you want to delete user:{" "}
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
              <Button text="Delete" onClick={confirmDelete} variant="primary" />
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
