import { useEffect, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import "./Dashboard.css";
import "./SystemSettings.css";
import "./MaintenanceSettings.css";

type MaintenanceStatus = "active" | "inactive";

type MaintenanceNotificationChannel = "email" | "sms" | "in_app";

type MaintenanceRecipients = {
  superAdmins: boolean;
  facilitators: boolean;
  mentors: boolean;
  learners: boolean;
};

type AllowedDuringMaintenance = {
  mentors: boolean;
  learners: boolean;
};

type MaintenanceSettingsSnapshot = {
  status: MaintenanceStatus;
  scheduledStart: string;
  scheduledEnd: string;
  allowedDuringMaintenance: AllowedDuringMaintenance;
  notificationChannel: MaintenanceNotificationChannel;
  recipients: MaintenanceRecipients;
  subject: string;
  message: string;
};

const STORAGE_KEY = "maintenance-settings";

export default function MaintenanceSettings() {
  const [status, setStatus] = useState<MaintenanceStatus>("active");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");

  const [allowedDuringMaintenance, setAllowedDuringMaintenance] =
    useState<AllowedDuringMaintenance>({
      mentors: false,
      learners: false,
    });

  const [notificationChannel, setNotificationChannel] =
    useState<MaintenanceNotificationChannel>("email");

  const [recipients, setRecipients] = useState<MaintenanceRecipients>({
    superAdmins: true,
    facilitators: true,
    mentors: false,
    learners: false,
  });

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<MaintenanceSettingsSnapshot>;

      if (parsed.status === "active" || parsed.status === "inactive") {
        setStatus(parsed.status);
      }
      if (typeof parsed.scheduledStart === "string") {
        setScheduledStart(parsed.scheduledStart);
      }
      if (typeof parsed.scheduledEnd === "string") {
        setScheduledEnd(parsed.scheduledEnd);
      }
      if (parsed.allowedDuringMaintenance) {
        setAllowedDuringMaintenance((prev) => ({
          ...prev,
          ...parsed.allowedDuringMaintenance,
        }));
      }
      if (
        parsed.notificationChannel === "email" ||
        parsed.notificationChannel === "sms" ||
        parsed.notificationChannel === "in_app"
      ) {
        setNotificationChannel(parsed.notificationChannel);
      }
      if (parsed.recipients) {
        setRecipients((prev) => ({
          ...prev,
          ...parsed.recipients,
        }));
      }
      if (typeof parsed.subject === "string") {
        setSubject(parsed.subject);
      }
      if (typeof parsed.message === "string") {
        setMessage(parsed.message);
      }
    } catch {
      // ignore invalid localStorage value
    }
  }, []);

  const handleSave = () => {
    const snapshot: MaintenanceSettingsSnapshot = {
      status,
      scheduledStart,
      scheduledEnd,
      allowedDuringMaintenance,
      notificationChannel,
      recipients,
      subject,
      message,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  };

  return (
    <>
      <div className="facilitator-dashboard-content">
        <div className="dashboard-header">
          <h2>MAINTENANCE</h2>
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
                  checked={allowedDuringMaintenance.mentors}
                  onChange={(e) =>
                    setAllowedDuringMaintenance((prev) => ({
                      ...prev,
                      mentors: e.target.checked,
                    }))
                  }
                />
                <span>Mentors</span>
              </label>
              <label className="system-settings__option">
                <input
                  type="checkbox"
                  checked={allowedDuringMaintenance.learners}
                  onChange={(e) =>
                    setAllowedDuringMaintenance((prev) => ({
                      ...prev,
                      learners: e.target.checked,
                    }))
                  }
                />
                <span>Learners</span>
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
                    checked={recipients.superAdmins}
                    onChange={(e) =>
                      setRecipients((prev) => ({
                        ...prev,
                        superAdmins: e.target.checked,
                      }))
                    }
                  />
                  <span>Super Admin</span>
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
                  <span>Facilitator</span>
                </label>
                <label className="system-settings__option">
                  <input
                    type="checkbox"
                    checked={recipients.mentors}
                    onChange={(e) =>
                      setRecipients((prev) => ({
                        ...prev,
                        mentors: e.target.checked,
                      }))
                    }
                  />
                  <span>Mentors</span>
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
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                />
              </div>
              <div className="maintenance__field">
                <div className="maintenance__field-label">Scheduled End</div>
                <input
                  className="maintenance__input"
                  type="datetime-local"
                  value={scheduledEnd}
                  onChange={(e) => setScheduledEnd(e.target.value)}
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
    </>
  );
}
