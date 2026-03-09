import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../services/supabaseClient";
import ProfileImageUpload from "../components/ProfileImageUpload";
import InputField from "../components/InputField";
import Button from "../components/Button";
import "./Profile.css";

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState<string>("");
  const [learnerName, setLearnerName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [learnerAddress, setLearnerAddress] = useState<string>("");
  const [learnerId, setLearnerId] = useState<string>("");
  const [programme, setProgramme] = useState<string>("Software Development");
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  // Ensure email is set from user auth if not already set
  useEffect(() => {
    if (user && !email) {
      setEmail(user.email || "");
    }
  }, [user, email]);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("learner_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) {
        console.error("Error loading profile:", error);
        return;
      }

      if (data) {
        setLearnerName(data.learner_name || "");
        setEmail(data.email || user?.email || "");
        setLearnerAddress(data.learner_address || "");
        setLearnerId(data.learner_identifier || "");
        setProgramme(data.programme || "Software Development");
        setProfileImage(data.profile_image_url || "");
      } else if (user) {
        // No profile found - set name from user email and email from user auth
        setLearnerName(user.email?.split("@")[0] || "");
        setEmail(user.email || "");
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      if (user) {
        setEmail(user.email || "");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      // Build the profile data
      const profileData = {
        user_id: user.id,
        learner_name: learnerName,
        email: email,
        learner_address: learnerAddress,
        learner_identifier: learnerId,
        programme: programme,
        profile_image_url: profileImage,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("learner_profiles")
        .upsert(profileData, {
          onConflict: "user_id",
        });

      if (error) throw error;

      setMessage("Profile saved successfully!");
      // Reload to ensure we have the latest data
      await loadProfile();
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setMessage(`Failed to save profile: ${err.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
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
          {message && (
            <div
              style={{
                padding: "12px",
                marginBottom: "16px",
                borderRadius: "6px",
                backgroundColor: message.includes("success")
                  ? "#d1fae5"
                  : "#fee2e2",
                color: message.includes("success") ? "#065f46" : "#991b1b",
              }}
            >
              {message}
            </div>
          )}
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
            disabled={true}
          />
          <small
            style={{
              color: "#6b7280",
              fontSize: "12px",
              marginTop: "-8px",
              display: "block",
            }}
          >
            Contact admin to change your email address
          </small>

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
              text={saving ? "Saving..." : "SAVE"}
              type="submit"
              className="save-button"
              disabled={saving || loading}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
