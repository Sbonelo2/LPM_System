import React from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from '../components/SideBar';
import DashboardStats from '../components/DashboardStats';
import ProfileImageUpload from '../components/ProfileImageUpload';
import Card from '../components/Card';
import Button from '../components/Button';
import TableComponent from '../components/TableComponent'; // Import TableComponent
import './Dashboard.css'; // Reusing the Dashboard CSS for consistent styling
import './AdminDashboard.css'; // Import AdminDashboard specific styles

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();

    const handleSignOut = () => {
        localStorage.removeItem('admin-token');
        navigate('/login');
    };

    // Placeholder data for Admin DashboardStats
    const adminDashboardStats = [
        { label: 'ACTIVE LEARNERS', value: 150 },
        { label: 'ACTIVE PLACEMENTS', value: 75 },
        { label: 'PENDING ISSUES', value: 12 },
        { label: 'COMPLIANCE STATUS', value: '95%' },
    ];

    // Placeholder data for Users Table
    const userColumns = [
        { key: 'fullName', header: 'Full Name' },
        { key: 'email', header: 'Email' },
        { key: 'role', header: 'Role' },
        { key: 'createdDate', header: 'Created Date' },
    ];

    const userData = [
        { fullName: 'Sine Mathebula', email: 'sine@example.com', role: 'Learner', createdDate: '2023-01-15' },
        { fullName: 'Jane Doe', email: 'jane.doe@example.com', role: 'QA Officer', createdDate: '2022-11-01' },
        { fullName: 'John Smith', email: 'john.smith@example.com', role: 'Programme Coordinator', createdDate: '2023-03-20' },
        { fullName: 'Admin User', email: 'test@admin.com', role: 'Admin', createdDate: '2023-02-10' },
    ];

    return (
        <div className="dashboard-layout">
            <SideBar />
            <div className="dashboard-content">
                <div className="dashboard-header">
                    <h2>ADMIN DASHBOARD</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>Logged in as ADMIN</p>
                        <div
                            onClick={() => navigate('/admin/profile')}
                            style={{ cursor: 'pointer' }}
                            className="admin-profile-icon"
                        >
                            <ProfileImageUpload editable={false} size={30} />
                        </div>
                    </div>
                </div>

                <div className="dashboard-stats-container">
                    <DashboardStats stats={adminDashboardStats} />
                </div>

                <div className="dashboard-my-placements-container">
                    <h3>USERS</h3>
                    <Card>
                        <TableComponent
                            columns={userColumns}
                            data={userData}
                            caption="System Users"
                        />
                    </Card>
                </div>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <Button text="Sign Out" onClick={handleSignOut} />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
