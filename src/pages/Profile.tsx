import React, { useState } from "react";
import ProfileImageUpload from "../components/ProfileImageUpload";
import InputField from "../components/InputField";
import Button from "../components/Button";
import "./Profile.css";

const Profile: React.FC = () => {
  const [profileImage, setProfileImage] = useState<string>("");
  const [learnerName, setLearnerName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [learnerAddress, setLearnerAddress] = useState<string>("");
  const [learnerId, setLearnerId] = useState<string>("");
  const [programme, setProgramme] = useState<string>("Software Development");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate save operation
    setTimeout(() => {
      console.log("Profile saved:", {
        profileImage,
        learnerName,
        email,
        learnerAddress,
        learnerId,
        programme,
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <ProfileImageUpload 
            currentImage={profileImage}
            onImageChange={setProfileImage}
          />
        </div>

        <form className="profile-form" onSubmit={handleSave}>
          <InputField
            label="Learner name"
            value={learnerName}
            onChange={setLearnerName}
            placeholder="Enter name"
            required
            disabled={loading}
          />

          <InputField
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="Enter email"
            type="email"
            required
            disabled={loading}
          />

          <InputField
            label="Learner Address"
            value={learnerAddress}
            onChange={setLearnerAddress}
            placeholder="Enter address"
            required
            disabled={loading}
          />

          <InputField
            label="Learner ID"
            value={learnerId}
            onChange={setLearnerId}
            placeholder="Enter ID"
            required
            disabled={loading}
          />

          <div className="form-group">
            <label className="form-label">Select Programme</label>
            <select 
              className="form-select"
              value={programme}
              onChange={(e) => setProgramme(e.target.value)}
              disabled={loading}
            >
              <option value="Software Development">Software Development</option>
              <option value="Data Science">Data Science</option>
              <option value="Web Development">Web Development</option>
              <option value="Mobile Development">Mobile Development</option>
            </select>
          </div>

          <div className="form-actions">
            <Button
              text={loading ? "Saving..." : "SAVE"}
              type="submit"
              className="save-button"
              disabled={loading}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
