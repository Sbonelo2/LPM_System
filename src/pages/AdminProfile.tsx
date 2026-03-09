import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import ProfileImageUpload from '../components/ProfileImageUpload';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
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
  const [loading, setLoading] = useState<boolean>(true);
  const [formLoading, setFormLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name, email, address')
            .eq('id', user.id)
            .single();

          if (error) throw error;

          if (data) {
            setFullName(data.full_name || '');
            setEmail(data.email || '');
            setAddress(data.address || '');
          }
        } catch (err: any) {
          setMessage(`Error: ${err.message}`);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [user]);

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
    setFormLoading(true);
    setMessage("");
    setPasswordError("");

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, address: address })
        .eq('id', user!.id);

      if (error) throw error;
      setMessage("Profile updated successfully!");
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    setFormLoading(true);
    setMessage("");
    setPasswordError("");

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setMessage("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(`Error: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <div className="facilitator-dashboard-content">
        <div className="dashboard-header">
          <h2>FACILITATOR PROFILE</h2>
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
                  disabled={formLoading}
                />
                <InputField
                  label="Address"
                  value={address}
                  onChange={setAddress}
                  placeholder="Enter address"
                  required
                  disabled={formLoading}
                />
                <InputField
                  label="Email"
                  value={email}
                  onChange={() => {}}
                  type="email"
                  disabled={true}
                />
                <Button
                  text={formLoading ? "Saving..." : "Save Profile Changes"}
                  type="submit"
                  disabled={formLoading}
                />
              </form>

              <h3 style={{ marginTop: "20px" }}>Change Password</h3>
              <InputField
                label="New Password"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                error={passwordError}
                disabled={formLoading}
              />
              <InputField
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                error={passwordError}
                disabled={formLoading}
              />
              <Button
                text={formLoading ? "Updating..." : "Update Password"}
                onClick={handlePasswordUpdate}
                disabled={formLoading}
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdminProfile;
