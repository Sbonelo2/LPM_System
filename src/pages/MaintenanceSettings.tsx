import { useState } from "react";
import SideBar from "../components/SideBar";
import AdminTopBar from "../components/AdminTopBar";
import Card from "../components/Card";
import Button from "../components/Button";
import "./Dashboard.css";
import "./SystemSettings.css";
import "./MaintenanceSettings.css";

type MaintenanceStatus = "active" | "inactive";

type MaintenanceNotificationChannel = "email" | "sms" | "in_app";

type MaintenanceRecipients = {
  allAdmins: boolean;
  qaOfficer: boolean;
  learners: boolean;
  facilitators: boolean;
};

type AllowedDuringMaintenance = {
  adminsOnly: boolean;
  qaOfficers: boolean;
  programmeCoordinators: boolean;
};

export default function MaintenanceSettings() {
  const [status, setStatus] = useState<MaintenanceStatus>("active");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");

  const [allowedDuringMaintenance, setAllowedDuringMaintenance] =
    useState<AllowedDuringMaintenance>({
      adminsOnly: true,
      qaOfficers: true,
      programmeCoordinators: false,
    });

  const [notificationChannel, setNotificationChannel] =
    useState<MaintenanceNotificationChannel>("email");

  const [recipients, setRecipients] = useState<MaintenanceRecipients>({
    allAdmins: false,
    qaOfficer: false,
    learners: true,
    facilitators: true,
  });

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSave = () => {
    console.log("Maintenance settings saved", {
      status,
      scheduledStart,
      scheduledEnd,
      allowedDuringMaintenance,
      notificationChannel,
      recipients,
      subject,
      message,
    });
  };

  return (
    <div className="dashboard-layout">
      <SideBar />
      <div className="dashboard-content">
        <div className="dashboard-topbar">
          <AdminTopBar
            subtitle="Admin"
            userName="Dwayne"
            profilePath="/admin/profile"
          />
        </div>

        <h2 className="maintenance__page-title">MaintenanceSettings</h2>

        <div className="maintenance__top-grid">
          <Card className="maintenance__card">
            <div className="maintenance__section-title">
              Maintenance Status:
            </div>
            <div className="system-settings__radio-group" role="radiogroup">
              <label className="system-settings__option">
                <input
                  type="radio"
                  name="maintenance-status"
                  checked={status === "active"}
                  onChange={() => setStatus("active")}
                />
                <span>Active</span>
              </label>
              <label className="system-settings__option">
                <input
                  type="radio"
                  name="maintenance-status"
                  checked={status === "inactive"}
                  onChange={() => setStatus("inactive")}
                />
                <span>Inactive</span>
              </label>
            </div>
          </Card>

          <Card className="maintenance__card maintenance__allowed-card">
            <div className="maintenance__section-title">
              Allowed During maintenance :
            </div>
            <div className="system-settings__checkbox-group">
              <label className="system-settings__option">
                <input
                  type="checkbox"
                  checked={allowedDuringMaintenance.adminsOnly}
                  onChange={(e) =>
                    setAllowedDuringMaintenance((prev) => ({
                      ...prev,
                      adminsOnly: e.target.checked,
                    }))
                  }
                />
                <span>Admins Only</span>
              </label>
              <label className="system-settings__option">
                <input
                  type="checkbox"
                  checked={allowedDuringMaintenance.qaOfficers}
                  onChange={(e) =>
                    setAllowedDuringMaintenance((prev) => ({
                      ...prev,
                      qaOfficers: e.target.checked,
                    }))
                  }
                />
                <span>QA officers</span>
              </label>
              <label className="system-settings__option">
                <input
                  type="checkbox"
                  checked={allowedDuringMaintenance.programmeCoordinators}
                  onChange={(e) =>
                    setAllowedDuringMaintenance((prev) => ({
                      ...prev,
                      programmeCoordinators: e.target.checked,
                    }))
                  }
                />
                <span>Programme Coordinators</span>
              </label>
            </div>
          </Card>
        </div>

        <section className="maintenance__notifications">
          <div className="maintenance__notifications-title">
            Notifications During Maintenance
          </div>

          <div className="maintenance__notifications-grid">
            <Card className="maintenance__card">
              <div className="system-settings__card-title">
                Notification type
              </div>
              <div className="system-settings__radio-group" role="radiogroup">
                <label className="system-settings__option">
                  <input
                    type="radio"
                    name="maintenance-notification-type"
                    checked={notificationChannel === "email"}
                    onChange={() => setNotificationChannel("email")}
                  />
                  <span>Email</span>
                </label>
                <label className="system-settings__option">
                  <input
                    type="radio"
                    name="maintenance-notification-type"
                    checked={notificationChannel === "sms"}
                    onChange={() => setNotificationChannel("sms")}
                  />
                  <span>SMS</span>
                </label>
                <label className="system-settings__option">
                  <input
                    type="radio"
                    name="maintenance-notification-type"
                    checked={notificationChannel === "in_app"}
                    onChange={() => setNotificationChannel("in_app")}
                  />
                  <span>In-App</span>
                </label>
              </div>
            </Card>

            <Card className="maintenance__card">
              <div className="system-settings__card-title">Recipients</div>
              <div className="system-settings__checkbox-group">
                <label className="system-settings__option">
                  <input
                    type="checkbox"
                    checked={recipients.allAdmins}
                    onChange={(e) =>
                      setRecipients((prev) => ({
                        ...prev,
                        allAdmins: e.target.checked,
                      }))
                    }
                  />
                  <span>All admins</span>
                </label>
                <label className="system-settings__option">
                  <input
                    type="checkbox"
                    checked={recipients.qaOfficer}
                    onChange={(e) =>
                      setRecipients((prev) => ({
                        ...prev,
                        qaOfficer: e.target.checked,
                      }))
                    }
                  />
                  <span>QA Officer</span>
                </label>
                <label className="system-settings__option">
                  <input
                    type="checkbox"
                    checked={recipients.learners}
                    onChange={(e) =>
                      setRecipients((prev) => ({
                        ...prev,
                        learners: e.target.checked,
                      }))
                    }
                  />
                  <span>Learners</span>
                </label>
                <label className="system-settings__option">
                  <input
                    type="checkbox"
                    checked={recipients.facilitators}
                    onChange={(e) =>
                      setRecipients((prev) => ({
                        ...prev,
                        facilitators: e.target.checked,
                      }))
                    }
                  />
                  <span>Facilitators</span>
                </label>
              </div>
            </Card>
          </div>

          <Card className="maintenance__card maintenance__template-card">
            <div className="system-settings__card-title">Message Template</div>

            <div className="maintenance__schedule">
              <div className="maintenance__field">
                <div className="maintenance__field-label">Scheduled Start</div>
                <input
                  className="maintenance__input"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  placeholder="YYYY-MM-DD HH:mm"
                />
              </div>
              <div className="maintenance__field">
                <div className="maintenance__field-label">Scheduled End</div>
                <input
                  className="maintenance__input"
                  value={scheduledEnd}
                  onChange={(e) => setScheduledEnd(e.target.value)}
                  placeholder="YYYY-MM-DD HH:mm"
                />
              </div>
            </div>

            <label className="system-settings__field">
              <span className="system-settings__field-label">Subject</span>
              <input
                className="system-settings__input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </label>
            <label className="system-settings__field">
              <span className="system-settings__field-label">Message</span>
              <textarea
                className="system-settings__textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </label>
          </Card>
        </section>

        <div className="maintenance__actions">
          <Button text="Save Settings" variant="primary" onClick={handleSave} />
        </div>
      </div>
    </div>
  );
}
