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
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../utils/dateUtils";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdDate: string;
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
  const { user } = useAuth();
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

  // Notification states
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [selectedUserForNotification, setSelectedUserForNotification] = useState<User | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string>("");
  const [notificationDetails, setNotificationDetails] = useState<string>("");
  const [notificationCanReply, setNotificationCanReply] = useState<boolean>(true);

  const logAudit = async (action: string, details: string) => {
    try {
      await supabase.from('audit_logs').insert([{
        user_id: user?.id,
        user_email: user?.email,
        action: action.toUpperCase(),
        module: 'USER MANAGEMENT',
        details: details
      }]);
    } catch (err) {
      console.warn("Audit logging failed:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedUsers: User[] = (data || []).map((u: any) => ({
        id: u.id,
        fullName: u.full_name || "N/A",
        email: u.email || "N/A",
        role: u.role || "learner",
        createdDate: formatDate(u.created_at),
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
    setGeneratedCredentials(null);
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddUserError("");
    setGeneratedCredentials(null);
  };

  const handleSaveNewUser = async () => {
    const trimmedFullName = newFullName.trim();
    const trimmedEmail = newEmail.trim().toLowerCase();
    const trimmedRole = newRole.trim();

    if (!trimmedFullName || !trimmedEmail || !trimmedRole) {
      setAddUserError("Please fill in Full Name, Email, and Role.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setAddUserError("Please enter a valid email address (e.g., user@example.com).");
      return;
    }

    setProcessing(true);
    setAddUserError("");

    try {
      const password = generateSystemPassword();
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: password,
        options: {
          data: {
            full_name: trimmedFullName,
            role: trimmedRole,
          },
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
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: authData.user.id,
          full_name: trimmedFullName,
          email: trimmedEmail,
          role: trimmedRole,
        });

        if (profileError) console.error("Profile upsert error:", profileError);

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

        await logAudit('CREATE', `Created new user: ${trimmedFullName} (${trimmedEmail}) as ${trimmedRole}`);
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

        await logAudit('UPDATE', `Updated user: ${editedFullName}. Role changed to ${editedRole}`);
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
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", userToDelete.id);

        if (error) throw error;

        await logAudit('DELETE', `Removed user record for: ${userToDelete.fullName} (${userToDelete.email})`);
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

  const [showAssignMentorModal, setShowAssignMentorModal] = useState<boolean>(false);
  const [selectedLearnerForMentor, setSelectedLearnerForMentor] = useState<User | null>(null);
  const [mentors, setMentors] = useState<DropdownOption[]>([]);
  const [selectedMentorId, setSelectedMentorId] = useState<string>("");

  const fetchMentors = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "mentor");
      
      if (error) throw error;
      setMentors((data || []).map(m => ({ label: `${m.full_name} (${m.email})`, value: m.id })));
    } catch (err) {
      console.error("Error fetching mentors:", err);
    }
  };

  const handleOpenAssignMentor = async (learner: User) => {
    setSelectedLearnerForMentor(learner);
    await fetchMentors();
    
    // Check if learner already has a mentor
    const { data } = await supabase
      .from("learner_profiles")
      .select("mentor_id")
      .eq("user_id", learner.id)
      .maybeSingle();
    
    setSelectedMentorId(data?.mentor_id || "");
    setShowAssignMentorModal(true);
  };

  const handleSaveMentorAssignment = async () => {
    if (!selectedLearnerForMentor) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("learner_profiles")
        .update({ mentor_id: selectedMentorId || null })
        .eq("user_id", selectedLearnerForMentor.id);

      if (error) throw error;

      const mentorName = mentors.find(m => m.value === selectedMentorId)?.label || "None";
      await logAudit('UPDATE', `Assigned mentor ${mentorName} to learner ${selectedLearnerForMentor.fullName}`);
      showSnackbar(`Mentor assigned to ${selectedLearnerForMentor.fullName}`);
      setShowAssignMentorModal(false);
    } catch (err: any) {
      showSnackbar(`Failed to assign mentor: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleSendNotification = async () => {
    if (!selectedUserForNotification || !notificationMessage.trim()) {
      showSnackbar("Please enter a message.");
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase.from("notifications").insert([
        {
          user_id: selectedUserForNotification.id,
          message: notificationMessage.trim(),
          details: notificationDetails.trim(),
          can_reply: notificationCanReply,
          created_by: user?.id,
        },
      ]);

      if (error) throw error;

      await logAudit('NOTIFICATION', `Sent notification to ${selectedUserForNotification.fullName}: ${notificationMessage}`);
      showSnackbar(`Notification sent to ${selectedUserForNotification.fullName}`);
      setShowNotificationModal(false);
      setNotificationMessage("");
      setNotificationDetails("");
    } catch (err: any) {
      showSnackbar(`Failed to send notification: ${err.message}`);
    } finally {
      setProcessing(false);
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
          {user.role === "learner" && (
            <span
              onClick={() => handleOpenAssignMentor(user)}
              style={{ cursor: "pointer", color: "#16A34A", fontSize: "1.2em" }}
              title="Assign Mentor"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 3c-4.963 0-9 4.037-9 9s4.037 9 9 9s9-4.037 9-9s-4.037-9-9-9zm0 16c-3.859 0-7-3.141-7-7s3.141-7 7-7s7 3.141 7 7s-3.141 7-7 7zm.707-7l2.647-2.646l-1.414-1.414L11.293 10.5L8.646 7.854L7.232 9.268L9.879 11.914L7.232 14.56l1.414 1.414l2.647-2.646l2.647 2.646l1.414-1.414L12.707 12z" transform="rotate(45 12 12)" />
                <path fill="currentColor" d="M12 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-3 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V17a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-1.5z" />
              </svg>
            </span>
          )}
          <span
            onClick={() => {
              setSelectedUserForNotification(user);
              setShowNotificationModal(true);
            }}
            style={{ cursor: "pointer", color: "#F59E0B", fontSize: "1.2em" }}
            title="Send Notification"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="facilitator-dashboard-content">
      <div className="dashboard-header">
        <h2>USER & ROLE MANAGEMENT</h2>
        <Button text="Add User" onClick={handleAddUser} variant="primary" />
      </div>

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
                <strong style={{color: '#000'}}>System generated credentials</strong>
                <span style={{color: '#000'}}><strong>Email:</strong> {generatedCredentials.email}</span>
                <span style={{color: '#000'}}><strong>Role:</strong> {generatedCredentials.role.toUpperCase()}</span>
                <span style={{ fontFamily: "monospace", color: '#000' }}><strong>Temporary Password:</strong> {generatedCredentials.password}</span>
                <span style={{ fontSize: "0.9rem", color: '#000' }}>Share these credentials with the user. They have been saved to the system.</span>
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
          </div>
        </Modal>
      )}

      {showAssignMentorModal && selectedLearnerForMentor && (
        <Modal 
          isOpen={showAssignMentorModal} 
          onClose={() => setShowAssignMentorModal(false)} 
          title={`Assign Mentor to ${selectedLearnerForMentor.fullName}`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <p style={{ color: '#000' }}>Select a mentor to assign to this learner. The mentor will be able to review and approve the learner's documents.</p>
            <Dropdown 
              label="Select Mentor" 
              value={selectedMentorId} 
              onChange={setSelectedMentorId} 
              options={mentors} 
              placeholder="Select a mentor" 
              disabled={processing}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <Button text="Cancel" onClick={() => setShowAssignMentorModal(false)} variant="secondary" />
              <Button 
                text={processing ? "Assigning..." : "Assign Mentor"} 
                onClick={handleSaveMentorAssignment} 
                variant="primary" 
                disabled={processing} 
              />
            </div>
          </div>
        </Modal>
      )}

      {showNotificationModal && selectedUserForNotification && (
        <Modal 
          isOpen={showNotificationModal} 
          onClose={() => setShowNotificationModal(false)} 
          title={`Send Notification to ${selectedUserForNotification.fullName}`}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <InputField 
              label="Subject / Message" 
              value={notificationMessage} 
              onChange={setNotificationMessage} 
              required 
              placeholder="Quick summary"
              disabled={processing} 
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.9rem", color: "#000" }}>Full Details</label>
              <textarea
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  minHeight: "100px",
                  fontFamily: "inherit",
                  color: "#000"
                }}
                value={notificationDetails}
                onChange={(e) => setNotificationDetails(e.target.value)}
                placeholder="Enter full notification content here..."
                disabled={processing}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="checkbox" 
                id="can_reply_admin" 
                checked={notificationCanReply} 
                onChange={(e) => setNotificationCanReply(e.target.checked)} 
              />
              <label htmlFor="can_reply_admin" style={{ cursor: 'pointer', color: '#000' }}>Allow recipient to reply</label>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <Button text="Cancel" onClick={() => setShowNotificationModal(false)} variant="secondary" />
              <Button 
                text={processing ? "Sending..." : "Send Notification"} 
                onClick={handleSendNotification} 
                variant="primary" 
                disabled={processing} 
              />
            </div>
          </div>
        </Modal>
      )}

      <Snackbar message={snackbarMessage} onClose={handleCloseSnackbar} />
    </div>
  );
};

export default AdminUserManagement;
