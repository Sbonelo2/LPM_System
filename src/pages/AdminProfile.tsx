import React, { useState } from "react";
import ProfileImageUpload from "../components/ProfileImageUpload";
import InputField from "../components/InputField";
import Button from "../components/Button";
import "./AdminProfile.css";

const AdminProfile: React.FC = () => {
  const [profileImage, setProfileImage] = useState<string>("");
  const [fullName, setFullName] = useState<string>("Dwanyne");
  const [email, setEmail] = useState<string>("dwanyne@example.com");
  const [phoneNumber, setPhoneNumber] = useState<string>("+27 123 4567");
  const [role, setRole] = useState<string>("Administrator");
  const [bio, setBio] = useState<string>("Passionate educator with 5+ years of experience in technology education.");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate save operation
    setTimeout(() => {
      console.log("Admin Profile saved:", {
        profileImage,
        fullName,
        email,
        phoneNumber,
        role,
        bio,
      });
      setLoading(false);
    }, 1000);
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="admin-profile-page">
      <div className="admin-profile-header">
        <button onClick={handleBack} className="back-button">
          ← Back
        </button>
        <h1 className="page-title">Learner Placement System</h1>
      </div>

      <div className="admin-profile-card">
        <div className="profile-section">
          <div className="profile-image-section">
            <ProfileImageUpload 
              currentImage={profileImage}
              onImageChange={setProfileImage}
            />
            <p className="profile-name">Dwanyne</p>
            <p className="profile-role">Administrator</p>
          </div>

          <form className="admin-profile-form" onSubmit={handleSave}>
            <InputField
              label="Full Name"
              value={fullName}
              onChange={setFullName}
              placeholder="Enter full name"
              required
              disabled={loading}
            />

            <InputField
              label="Email Address"
              value={email}
              onChange={setEmail}
              placeholder="Enter email address"
              type="email"
              required
              disabled={loading}
            />

            <InputField
              label="Phone Number"
              value={phoneNumber}
              onChange={setPhoneNumber}
              placeholder="Enter phone number"
              type="tel"
              required
              disabled={loading}
            />

            <div className="form-group">
              <label className="form-label">Role</label>
              <select 
                className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Manager">Manager</option>
                  <option value="Educator">Educator</option>
                  <option value="Student">Student</option>
                </select>
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea 
                className="form-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Enter your bio"
                  rows={4}
                  disabled={loading}
                />
            </div>

            <div className="form-actions">
              <Button
                text={loading ? "Saving..." : "Save Changes"}
                type="submit"
                className="save-button"
                disabled={loading}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
