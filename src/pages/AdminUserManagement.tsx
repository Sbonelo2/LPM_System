import React, { useState } from 'react';
import SideBar from '../components/SideBar';
import Button from '../components/Button';
import TableComponent from '../components/TableComponent';
import Card from '../components/Card';
import Modal from '../components/Modal'; // Import Modal
import Snackbar from '../components/Snackbar'; // Import Snackbar
import InputField from '../components/InputField'; // Import InputField
import { type TableColumn } from '../components/TableComponent';


interface User {
    id: string;
    fullName: string;
    email: string;
    role: string;
    createdDate: string;
}

const AdminUserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([
        { id: '1', fullName: 'Sine Mathebula', email: 'sine@example.com', role: 'Learner', createdDate: '2023-01-15' },
        { id: '2', fullName: 'Jane Doe', email: 'jane.doe@example.com', role: 'QA Officer', createdDate: '2022-11-01' },
        { id: '3', fullName: 'John Smith', email: 'john.smith@example.com', role: 'Programme Coordinator', createdDate: '2023-03-20' },
        { id: '4', fullName: 'Admin User', email: 'test@admin.com', role: 'Admin', createdDate: '2023-02-10' },
    ]);
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
        showSnackbar('Add User functionality coming soon!');
        // In a real application, this would open a modal or navigate to a user creation form
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
                            <InputField
                                label="Role"
                                value={editedRole}
                                onChange={setEditedRole}
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
