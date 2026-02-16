import React, { useEffect, useState } from 'react';
import SideBar from '../components/SideBar';
import Button from '../components/Button';
import TableComponent from '../components/TableComponent';
import Card from '../components/Card';
import Modal from '../components/Modal'; // Import Modal
import Snackbar from '../components/Snackbar'; // Import Snackbar
import InputField from '../components/InputField'; // Import InputField
import Dropdown, { type DropdownOption } from '../components/Dropdown';
import { type TableColumn } from '../components/TableComponent';


interface User {
    id: string;
    fullName: string;
    email: string;
    role: string;
    createdDate: string;
}

const DEFAULT_USERS: User[] = [
    { id: '1', fullName: 'Sine Mathebula', email: 'sine@example.com', role: 'Learner', createdDate: '2023-01-15' },
    { id: '2', fullName: 'Jane Doe', email: 'jane.doe@example.com', role: 'QA Officer', createdDate: '2022-11-01' },
    { id: '3', fullName: 'John Smith', email: 'john.smith@example.com', role: 'Programme Coordinator', createdDate: '2023-03-20' },
    { id: '4', fullName: 'Admin User', email: 'test@admin.com', role: 'Admin', createdDate: '2023-02-10' },
];

const USERS_STORAGE_KEY = 'admin_user_management_users';
const PRIVILEGED_ROLES = new Set([
    'Admin',
    'Coordinator',
    'Facilitator',
    'Quality Assurance Officer',
]);

const ROLE_OPTIONS: DropdownOption[] = [
    { label: 'Admin', value: 'Admin' },
    { label: 'Coordinator', value: 'Coordinator' },
    { label: 'Facilitator', value: 'Facilitator' },
    { label: 'Quality Assurance Officer', value: 'Quality Assurance Officer' },
    { label: 'Learner', value: 'Learner' },
];

const generateSystemPassword = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let result = '';

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
    const [users, setUsers] = useState<User[]>(() => {
        try {
            const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
            if (!storedUsers) {
                return DEFAULT_USERS;
            }

            const parsedUsers: unknown = JSON.parse(storedUsers);
            if (Array.isArray(parsedUsers)) {
                return parsedUsers as User[];
            }
        } catch (error) {
            console.error('Failed to load users from local storage:', error);
        }

        return DEFAULT_USERS;
    });
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [newFullName, setNewFullName] = useState<string>('');
    const [newEmail, setNewEmail] = useState<string>('');
    const [newRole, setNewRole] = useState<string>('');
    const [addUserError, setAddUserError] = useState<string>('');
    const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedCredentials | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [showEditModal, setShowEditModal] = useState<boolean>(false); // State for edit modal
    const [userToEdit, setUserToEdit] = useState<User | null>(null); // State for user to edit
    const [editedFullName, setEditedFullName] = useState<string>('');
    const [editedEmail, setEditedEmail] = useState<string>('');
    const [editedRole, setEditedRole] = useState<string>('');
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');

    const showSnackbar = (message: string) => {
      setSnackbarMessage(message);
    };

    const handleCloseSnackbar = () => {
      setSnackbarMessage('');
    };

    const handleAddUser = () => {
        setAddUserError('');
        setNewFullName('');
        setNewEmail('');
        setNewRole('');
        setGeneratedCredentials(null);
        setShowAddModal(true);
    };

    const closeAddModal = () => {
        setShowAddModal(false);
        setAddUserError('');
        setGeneratedCredentials(null);
    };

    const handleSaveNewUser = () => {
        const trimmedFullName = newFullName.trim();
        const trimmedEmail = newEmail.trim();
        const trimmedRole = newRole.trim();

        if (!trimmedFullName || !trimmedEmail || !trimmedRole) {
            setAddUserError('Please fill in Full Name, Email, and Role.');
            return;
        }

        const emailExists = users.some(
            (user) => user.email.toLowerCase() === trimmedEmail.toLowerCase(),
        );
        if (emailExists) {
            setAddUserError('A user with this email already exists.');
            return;
        }

        const newUser: User = {
            id: Date.now().toString(),
            fullName: trimmedFullName,
            email: trimmedEmail,
            role: trimmedRole,
            createdDate: new Date().toISOString().split('T')[0],
        };

        setUsers(prevUsers => [newUser, ...prevUsers]);
        if (PRIVILEGED_ROLES.has(trimmedRole)) {
            const password = generateSystemPassword();
            setGeneratedCredentials({
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role,
                password,
            });
            showSnackbar(`User ${newUser.fullName} added. Share generated credentials.`);
            setNewFullName('');
            setNewEmail('');
            setNewRole('');
            setAddUserError('');
            return;
        }

        showSnackbar(`User ${newUser.fullName} added successfully!`);
        closeAddModal();
    };

    const formatCredentialsForSharing = (credentials: GeneratedCredentials): string => {
        return `Name: ${credentials.fullName}\nEmail: ${credentials.email}\nRole: ${credentials.role}\nTemporary Password: ${credentials.password}`;
    };

    const copyGeneratedCredentials = async () => {
        if (!generatedCredentials) {
            return;
        }

        try {
            await navigator.clipboard.writeText(formatCredentialsForSharing(generatedCredentials));
            showSnackbar('Credentials copied to clipboard.');
        } catch (error) {
            console.error('Failed to copy credentials:', error);
            showSnackbar('Unable to copy credentials.');
        }
    };

    const shareGeneratedCredentials = async () => {
        if (!generatedCredentials) {
            return;
        }

        const message = formatCredentialsForSharing(generatedCredentials);

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'New User Credentials',
                    text: message,
                });
                showSnackbar('Credentials shared.');
                return;
            }
        } catch (error) {
            console.error('Failed to share credentials:', error);
            showSnackbar('Unable to share credentials directly.');
            return;
        }

        try {
            await navigator.clipboard.writeText(message);
            showSnackbar('Share is not available. Credentials copied instead.');
        } catch (error) {
            console.error('Fallback copy failed:', error);
            showSnackbar('Unable to share or copy credentials.');
        }
    };

    const handleEditUser = (user: User) => {
        setUserToEdit(user);
        setEditedFullName(user.fullName);
        setEditedEmail(user.email);
        setEditedRole(user.role);
        setShowEditModal(true);
    };

    const handleSaveUser = () => {
        if (userToEdit) {
            const updatedUser: User = {
                ...userToEdit,
                fullName: editedFullName,
                email: editedEmail,
                role: editedRole,
            };
            setUsers(prevUsers => prevUsers.map(user => user.id === updatedUser.id ? updatedUser : user));
            showSnackbar(`User ${updatedUser.fullName} updated successfully!`);
            setUserToEdit(null);
            setShowEditModal(false);
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

    const confirmDelete = () => {
        if (userToDelete) {
            setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
            showSnackbar(`User ${userToDelete.fullName} deleted.`);
            setUserToDelete(null);
            setShowDeleteModal(false);
        }
    };

    const cancelDelete = () => {
        setUserToDelete(null);
        setShowDeleteModal(false);
    };

    useEffect(() => {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }, [users]);

    const userColumns: TableColumn<User>[] = [
        { key: 'fullName', header: 'Full Name' },
        { key: 'email', header: 'Email' },
        { key: 'role', header: 'Role' },
        { key: 'createdDate', header: 'Created Date' },
        {
            key: 'actions',
            header: 'Actions',
            render: (user: User) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span
                        onClick={() => handleEditUser(user)}
                        style={{ cursor: 'pointer', color: 'var(--primary-color)', fontSize: '1.2em' }}
                        title="Edit User"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83l3.75 3.75M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z"/></svg>
                    </span>
                    <span
                        onClick={() => handleDeleteUser(user)}
                        style={{ cursor: 'pointer', color: 'var(--secondary-color)', fontSize: '1.2em' }}
                        title="Delete User"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12l1.41 1.41L13.41 14l2.12 2.12l-1.41 1.41L12 15.41l-2.12 2.12l-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </span>
                </div>
            ),
        },
    ];

    return (
        <div className="dashboard-layout">
            <SideBar />
            <div className="dashboard-content">
                <div className="dashboard-header">
                    <h2>USER MANAGEMENT</h2>
                    <Button text="Add User" onClick={handleAddUser} variant="primary" />
                </div>

                <Card>
                    <h3>Users</h3>
                    <TableComponent
                        columns={userColumns}
                        data={users}
                        caption="Manage System Users"
                    />
                </Card>

                {showDeleteModal && (
                    <Modal
                        isOpen={showDeleteModal}
                        onClose={cancelDelete}
                        title="Confirm Deletion"
                    >
                        <p>Are you sure you want to delete user: <strong>{userToDelete?.fullName}</strong>?</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <Button text="Cancel" onClick={cancelDelete} variant="secondary" />
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
                                <p style={{ margin: 0, color: 'var(--secondary-color)' }}>
                                    {addUserError}
                                </p>
                            )}
                            {generatedCredentials && (
                                <div
                                    style={{
                                        border: '1px solid #d6d6d6',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        background: '#f8f8f8',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                    }}
                                >
                                    <strong>System generated credentials</strong>
                                    <span><strong>Email:</strong> {generatedCredentials.email}</span>
                                    <span><strong>Role:</strong> {generatedCredentials.role}</span>
                                    <span style={{ fontFamily: 'monospace' }}>
                                        <strong>Temporary Password:</strong> {generatedCredentials.password}
                                    </span>
                                    <span style={{ fontSize: '0.9rem' }}>
                                        Save and share these credentials now. The password is only shown here.
                                    </span>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                                        <Button text="Copy Credentials" onClick={copyGeneratedCredentials} variant="secondary" />
                                        <Button text="Share Credentials" onClick={shareGeneratedCredentials} variant="primary" />
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <Button text="Cancel" onClick={closeAddModal} variant="secondary" />
                                <Button text="Save User" onClick={handleSaveNewUser} variant="primary" />
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <Button text="Cancel" onClick={cancelEdit} variant="secondary" />
                                <Button text="Save" onClick={handleSaveUser} variant="primary" />
                            </div>
                        </div>
                    </Modal>
                )}

                <Snackbar
                  message={snackbarMessage}
                  onClose={handleCloseSnackbar}
                />
            </div>
        </div>
    );
};

export default AdminUserManagement;
