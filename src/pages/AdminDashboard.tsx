import React from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from '../components/SideBar';
import DashboardStats from '../components/DashboardStats';
import ProfileImageUpload from '../components/ProfileImageUpload';
import Card from '../components/Card';
import Button from '../components/Button';
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
                    <h3>Admin Specific Content</h3>
                    <Card>
                        <p>This area can be used for managing users, system settings, etc.</p>
                        <Button text="Sign Out" onClick={handleSignOut} />
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
