import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import ProfileImageUpload from '../components/ProfileImageUpload';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Card from '../components/Card';
import { supabase } from '../services/supabaseClient';
import './AdminProfile.css';
import '../pages/Dashboard.css';

const AdminProfile: React.FC = () => {
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Load user data on component mount
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, address, profile_image_url')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading user data:', error);
        // Set fallback values
        setFullName(user.email?.split('@')[0] || 'User');
        setEmail(user.email || '');
      } else {
        setFullName(data?.full_name || user.email?.split('@')[0] || 'User');
        setAddress(data?.address || '');
        setProfileImage(data?.profile_image_url || '');
        setEmail(user.email || '');
      }
    } catch (error) {
      console.error('Error:', error);
      setFullName(user?.email?.split('@')[0] || 'User');
      setEmail(user?.email || '');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setPasswordError("");

    if (!user) {
      setMessage("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          address: address,
          profile_image_url: profileImage,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        setMessage("Failed to update profile");
      } else {
        console.log("Profile updated successfully:", {
          fullName,
          address,
          profileImage,
        });
        setMessage("Profile updated successfully!");
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setLoading(true);
    setMessage("");
    setPasswordError("");

    if (!user) {
      setMessage("User not authenticated");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      // Update password with Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error updating password:', error);
        setMessage("Failed to update password");
      } else {
        console.log("Password updated successfully");
        setMessage("Password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const getRoleTitle = () => {
    const role = user?.user_metadata?.role;
    switch (role) {
      case 'super_admin':
        return 'SUPER ADMIN PROFILE';
      case 'mentor':
        return 'MENTOR PROFILE';
      case 'admin':
      case 'facilitator':
        return 'FACILITATOR PROFILE';
      default:
        return 'PROFILE';
    }
  };

  return (
    <>
      <div className="facilitator-dashboard-content">
      <div className="dashboard-header">
        <h2>{getRoleTitle()}</h2>
        </div>

        <div style={{ maxWidth: "600px", margin: "auto", padding: "20px" }}>
          {message && <p style={{ color: "green" }}>{message}</p>}
          <Card>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
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
                <Button
                  text={loading ? "Saving..." : "Save Profile Changes"}
                  type="submit"
                  disabled={loading}
                />
              </form>

              <h3 style={{ marginTop: "20px" }}>Change Password</h3>
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
              <Button
                text={loading ? "Updating..." : "Update Password"}
                onClick={handlePasswordUpdate}
                disabled={loading}
              />
            </div>
          </Card>
        </div>
      </div>
      </>
  );
};

export default AdminProfile;
