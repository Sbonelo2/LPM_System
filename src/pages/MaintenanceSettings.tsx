import { useEffect, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import Snackbar from "../components/Snackbar";
import { supabase } from "../services/supabaseClient";
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
  learners: boolean;
};

export default function MaintenanceSettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [status, setStatus] = useState<MaintenanceStatus>("active");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");

  const [allowedDuringMaintenance, setAllowedDuringMaintenance] =
    useState<AllowedDuringMaintenance>({
      adminsOnly: true,
      qaOfficers: true,
      programmeCoordinators: false,
      learners: false,
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

  const showSnackbar = (value: string) => {
    setSnackbarMessage(value);
  };

  const handleCloseSnackbar = () => {
    setSnackbarMessage("");
  };

  const toIsoOrNull = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  };

  const loadMaintenance = async () => {
    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("maintenance_settings")
      .select(
        "status, scheduled_start, scheduled_end, allow_admins_only, allow_qa_officers, allow_programme_coordinators, allow_learners, notification_channel, recipients, subject, message",
      )
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    if (data) {
      setStatus((data.status as MaintenanceStatus) ?? "inactive");
      setScheduledStart(
        data.scheduled_start ? String(data.scheduled_start) : "",
      );
      setScheduledEnd(data.scheduled_end ? String(data.scheduled_end) : "");
      setAllowedDuringMaintenance({
        adminsOnly: Boolean(data.allow_admins_only),
        qaOfficers: Boolean(data.allow_qa_officers),
        programmeCoordinators: Boolean(data.allow_programme_coordinators),
        learners: Boolean(
          (data as { allow_learners?: boolean }).allow_learners,
        ),
      });
      setNotificationChannel(
        (data.notification_channel as MaintenanceNotificationChannel) ??
          "email",
      );

      const rec = (data.recipients ?? {}) as Partial<Record<string, boolean>>;
      setRecipients({
        allAdmins: Boolean(rec.all_admins),
        qaOfficer: Boolean(rec.qa_officer),
        learners: Boolean(rec.learners),
        facilitators: Boolean(rec.facilitators),
      });

      setSubject(String(data.subject ?? ""));
      setMessage(String(data.message ?? ""));
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setError("");

    const payload = {
      status,
      scheduled_start: toIsoOrNull(scheduledStart),
      scheduled_end: toIsoOrNull(scheduledEnd),
      allow_admins_only: allowedDuringMaintenance.adminsOnly,
      allow_qa_officers: allowedDuringMaintenance.qaOfficers,
      allow_programme_coordinators:
        allowedDuringMaintenance.programmeCoordinators,
      allow_learners: allowedDuringMaintenance.learners,
      notification_channel: notificationChannel,
      recipients: {
        all_admins: recipients.allAdmins,
        qa_officer: recipients.qaOfficer,
        learners: recipients.learners,
        facilitators: recipients.facilitators,
      },
      subject,
      message,
      updated_at: new Date().toISOString(),
    };

    const { error: saveError } = await supabase
      .from("maintenance_settings")
      .insert(payload);

    if (saveError) {
      setError(saveError.message);
      showSnackbar(`Save failed: ${saveError.message}`);
      return;
    }

    showSnackbar("Maintenance settings saved.");
    loadMaintenance();
  };

  useEffect(() => {
    loadMaintenance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="facilitator-dashboard-content">
        <div className="dashboard-header">
          <h2>MAINTENANCE</h2>
        </div>

        <h2 className="maintenance__page-title">MaintenanceSettings</h2>

        {loading ? (
          <LoadingSpinner message="Loading maintenance settings..." />
        ) : error ? (
          <p style={{ marginTop: 12, color: "var(--secondary-color)" }}>
            {error}
          </p>
        ) : null}

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
          <Button
            text="Save Settings"
            variant="primary"
            onClick={handleSave}
            disabled={loading}
          />
        </div>
      </div>

      <Snackbar message={snackbarMessage} onClose={handleCloseSnackbar} />
      </>
  );
}
