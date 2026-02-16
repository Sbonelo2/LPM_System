import { useState } from "react";
import AdminTopBar from "../components/AdminTopBar";
import InputField from "../components/InputField";
import Button from "../components/Button";
import "./EditUserAdmin.css";

export default function EditUserAdmin() {
  const [fullName, setFullName] = useState("Dwayne Johnson");
  const [email, setEmail] = useState("dwayne.johnson@example.com");
  const [role, setRole] = useState("Admin");

  return (
    <div className="dashboard-layout">
      <div className="dashboard-content">
        <div className="dashboard-topbar">
          <AdminTopBar
            subtitle="Admin"
            userName="Dwayne"
            profilePath="/admin/profile"
          />
        </div>

        <div className="edit-user-admin__content">
          <div className="edit-user-admin__card">
            <div className="edit-user-admin__form">
              <InputField
                label="Full Name"
                value={fullName}
                onChange={setFullName}
              />
              <InputField
                label="Email"
                value={email}
                onChange={setEmail}
                type="email"
              />
              <InputField label="Role" value={role} onChange={setRole} />

              <div className="edit-user-admin__actions">
                <Button className="edit-user-admin__edit-btn" variant="primary">
                  <span
                    className="edit-user-admin__edit-icon"
                    aria-hidden="true"
                  >
                    ✎
                  </span>
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
