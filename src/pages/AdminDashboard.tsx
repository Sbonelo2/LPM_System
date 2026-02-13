import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();

    const handleSignOut = () => {
        localStorage.removeItem('admin-token');
        navigate('/admin/signin');
    };

    return (
        <div>
            <h2>Admin Dashboard</h2>
            <p>Welcome, Admin!</p>
            <Button text="Sign Out" onClick={handleSignOut} />
        </div>
    );
};

export default AdminDashboard;
