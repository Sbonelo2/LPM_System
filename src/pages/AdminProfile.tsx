import React, { useState } from 'react';
import ProfileImageUpload from '../components/ProfileImageUpload';
import InputField from '../components/InputField';
import Button from '../components/Button';
import SideBar from '../components/SideBar'; // Import SideBar
import Card from '../components/Card'; // Import Card
import './AdminProfile.css'; // Existing CSS
import '../pages/Dashboard.css'; // Reusing dashboard layout CSS

const AdminProfile: React.FC = () => {
  const [profileImage, setProfileImage] = useState<string>('');
  const [fullName, setFullName] = useState<string>('Admin User');
  const [address, setAddress] = useState<string>('123 Admin St, Admin City');
  const [email, setEmail] = useState<string>('test@admin.com'); // Email is view-only
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setPasswordError('');

    // Simulate save operation
    setTimeout(() => {
      console.log('Admin Profile saved:', {
        profileImage,
        fullName,
        address,
      });
      setMessage('Profile updated successfully!');
      setLoading(false);
    }, 1000);
  };

  const handlePasswordUpdate = async () => {
    setLoading(true);
    setMessage('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    // Simulate password update operation
    setTimeout(() => {
      console.log('Password changed to:', newPassword);
      setMessage('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="dashboard-layout"> {/* Use dashboard layout */}
      <SideBar /> {/* Include SideBar */}
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>ADMIN PROFILE</h2>
        </div>

        <div style={{ maxWidth: '600px', margin: 'auto', padding: '20px' }}>
          {message && <p style={{ color: 'green' }}>{message}</p>}
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <ProfileImageUpload
                currentImage={profileImage}
                onImageChange={setProfileImage}
                editable={true}
                size={100}
              />
              <form onSubmit={handleSave}>
                <InputField
                  label="Full Name"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Enter full name"
                  required
                  disabled={loading}
                />
                <InputField
                  label="Address"
                  value={address}
                  onChange={setAddress}
                  placeholder="Enter address"
                  required
                  disabled={loading}
                />
                <InputField
                  label="Email"
                  value={email}
                  onChange={setEmail} // onChange is required by InputField, but it's disabled
                  type="email"
                  disabled={true} // Email is view-only
                />
                <Button text={loading ? 'Saving...' : 'Save Profile Changes'} type="submit" disabled={loading} />
              </form>

              <h3 style={{ marginTop: '20px' }}>Change Password</h3>
              <InputField
                label="New Password"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                error={passwordError}
                disabled={loading}
              />
              <InputField
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                error={passwordError}
                disabled={loading}
              />
              <Button text={loading ? 'Updating...' : 'Update Password'} onClick={handlePasswordUpdate} disabled={loading} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
