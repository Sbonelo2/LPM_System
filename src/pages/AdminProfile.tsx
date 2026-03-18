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
  const [email, setEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [formLoading, setFormLoading] = useState<boolean>(false);

  const roleLabel = (() => {
    const role = user?.user_metadata?.role as string | undefined;
    if (!role) return "PROFILE";
    if (role === "super_admin") return "SUPER ADMIN PROFILE";
    if (role === "mentor") return "MENTOR PROFILE";
    if (role === "admin") return "FACILITATOR PROFILE";
    return `${role.replace("_", " ").toUpperCase()} PROFILE`;
  })();

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const [{ data: profile, error }, { data: imageRow }] = await Promise.all([
          supabase.from('profiles').select('full_name, email').eq('id', user.id).single(),
          supabase
            .from('role_profile_images')
            .select('image_url')
            .eq('user_id', user.id)
            .maybeSingle(),
        ]);

        if (error) {
          console.error('Error loading user data:', error);
          setFullName(user.email?.split('@')[0] || 'User');
          setEmail(user.email || '');
        } else {
          setFullName(profile?.full_name || user.email?.split('@')[0] || 'User');
          setEmail(profile?.email || user.email || '');
        }

        if (imageRow?.image_url) {
          setProfileImage(imageRow.image_url);
        }
      } catch (error: any) {
        console.error('Error:', error);
        setMessage(`Error: ${error.message}`);
        setFullName(user?.email?.split('@')[0] || 'User');
        setEmail(user?.email || '');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setMessage("");
    setPasswordError("");

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user!.id);

      if (error) throw error;

      const { error: imageError } = await supabase
        .from('role_profile_images')
        .upsert(
          {
            user_id: user!.id,
            image_url: profileImage || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        );

      if (imageError) throw imageError;
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
          <h2>{roleLabel}</h2>
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
