import { useMemo, useState } from "react";
import SideBar from "../components/SideBar";
import AdminTopBar from "../components/AdminTopBar";
import Card from "../components/Card";
import Button from "../components/Button";
import "./Dashboard.css";
import "./SystemSettings.css";

type NotificationChannel = "email" | "sms" | "in_app";

type RecipientKey = "all_admins" | "qa_officer" | "learners" | "facilitators";

type NotificationSetting = {
  id: string;
  title: string;
  channel: NotificationChannel;
  recipients: Record<RecipientKey, boolean>;
  subject: string;
  message: string;
};

const DEFAULT_RECIPIENTS: Record<RecipientKey, boolean> = {
  all_admins: false,
  qa_officer: false,
  learners: true,
  facilitators: false,
};

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState<
    | "notification"
    | "required_documents"
    | "compliance_rules"
    | "security_params"
  >("notification");

  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: "placement_assigned",
      title: "Learner Placement Assigned",
      channel: "email",
      recipients: { ...DEFAULT_RECIPIENTS, learners: true },
      subject: "Placement assigned",
      message: "A placement has been assigned.",
    },
    {
      id: "assessment_submitted",
      title: "Learner assessment submitted",
      channel: "email",
      recipients: { ...DEFAULT_RECIPIENTS, qa_officer: true },
      subject: "Assessment submitted",
      message: "A learner has submitted an assessment.",
    },
    {
      id: "learner_registered",
      title: "New learner Registered",
      channel: "email",
      recipients: { ...DEFAULT_RECIPIENTS, all_admins: true },
      subject: "New learner registered",
      message: "A new learner profile has been created.",
    },
    {
      id: "document_submitted",
      title: "Document submitted",
      channel: "email",
      recipients: { ...DEFAULT_RECIPIENTS, facilitators: true },
      subject: "Document submitted",
      message: "A document has been uploaded for review.",
    },
  ]);

  const recipientLabels = useMemo(
    () =>
      [
        { key: "all_admins", label: "All admins" },
        { key: "qa_officer", label: "QA Officer" },
        { key: "learners", label: "Learners" },
        { key: "facilitators", label: "Facilitators" },
      ] as const,
    [],
  );

  const handleSettingUpdate = (
    id: string,
    updater: (prev: NotificationSetting) => NotificationSetting,
  ) => {
    setSettings((prev) =>
      prev.map((item) => (item.id === id ? updater(item) : item)),
    );
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

        <h2 className="system-settings__page-title">System Settings</h2>

        <div
          className="system-settings__tabs"
          role="tablist"
          aria-label="System settings tabs"
        >
          <button
            type="button"
            className={
              "system-settings__tab" +
              (activeTab === "notification"
                ? " system-settings__tab--active"
                : "")
            }
            role="tab"
            aria-selected={activeTab === "notification"}
            onClick={() => setActiveTab("notification")}
          >
            Notification
          </button>
          <button
            type="button"
            className={
              "system-settings__tab" +
              (activeTab === "required_documents"
                ? " system-settings__tab--active"
                : "")
            }
            role="tab"
            aria-selected={activeTab === "required_documents"}
            onClick={() => setActiveTab("required_documents")}
          >
            Required Documents
          </button>
          <button
            type="button"
            className={
              "system-settings__tab" +
              (activeTab === "compliance_rules"
                ? " system-settings__tab--active"
                : "")
            }
            role="tab"
            aria-selected={activeTab === "compliance_rules"}
            onClick={() => setActiveTab("compliance_rules")}
          >
            Compliance rules
          </button>
          <button
            type="button"
            className={
              "system-settings__tab" +
              (activeTab === "security_params"
                ? " system-settings__tab--active"
                : "")
            }
            role="tab"
            aria-selected={activeTab === "security_params"}
            onClick={() => setActiveTab("security_params")}
          >
            Security Params
          </button>
        </div>

        {activeTab === "notification" ? (
          <div className="system-settings__content">
            {settings.map((setting) => (
              <section key={setting.id} className="system-settings__section">
                <h3 className="system-settings__section-title">
                  {setting.title}
                </h3>

                <div className="system-settings__grid">
                  <Card className="system-settings__card">
                    <div className="system-settings__card-title">
                      Notification type
                    </div>
                    <div
                      className="system-settings__radio-group"
                      role="radiogroup"
                    >
                      <label className="system-settings__option">
                        <input
                          type="radio"
                          name={`${setting.id}-channel`}
                          checked={setting.channel === "email"}
                          onChange={() =>
                            handleSettingUpdate(setting.id, (prev) => ({
                              ...prev,
                              channel: "email",
                            }))
                          }
                        />
                        <span>Email</span>
                      </label>
                      <label className="system-settings__option">
                        <input
                          type="radio"
                          name={`${setting.id}-channel`}
                          checked={setting.channel === "sms"}
                          onChange={() =>
                            handleSettingUpdate(setting.id, (prev) => ({
                              ...prev,
                              channel: "sms",
                            }))
                          }
                        />
                        <span>SMS</span>
                      </label>
                      <label className="system-settings__option">
                        <input
                          type="radio"
                          name={`${setting.id}-channel`}
                          checked={setting.channel === "in_app"}
                          onChange={() =>
                            handleSettingUpdate(setting.id, (prev) => ({
                              ...prev,
                              channel: "in_app",
                            }))
                          }
                        />
                        <span>In-App</span>
                      </label>
                    </div>
                  </Card>

                  <Card className="system-settings__card">
                    <div className="system-settings__card-title">
                      Recipients
                    </div>
                    <div className="system-settings__checkbox-group">
                      {recipientLabels.map((recipient) => (
                        <label
                          key={recipient.key}
                          className="system-settings__option"
                        >
                          <input
                            type="checkbox"
                            checked={setting.recipients[recipient.key]}
                            onChange={(e) =>
                              handleSettingUpdate(setting.id, (prev) => ({
                                ...prev,
                                recipients: {
                                  ...prev.recipients,
                                  [recipient.key]: e.target.checked,
                                },
                              }))
                            }
                          />
                          <span>{recipient.label}</span>
                        </label>
                      ))}
                    </div>
                  </Card>

                  <Card className="system-settings__card system-settings__card--template">
                    <div className="system-settings__card-title">
                      Message Template
                    </div>
                    <label className="system-settings__field">
                      <span className="system-settings__field-label">
                        Subject
                      </span>
                      <input
                        className="system-settings__input"
                        value={setting.subject}
                        onChange={(e) =>
                          handleSettingUpdate(setting.id, (prev) => ({
                            ...prev,
                            subject: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="system-settings__field">
                      <span className="system-settings__field-label">
                        Message
                      </span>
                      <textarea
                        className="system-settings__textarea"
                        value={setting.message}
                        onChange={(e) =>
                          handleSettingUpdate(setting.id, (prev) => ({
                            ...prev,
                            message: e.target.value,
                          }))
                        }
                        rows={3}
                      />
                    </label>
                  </Card>
                </div>
              </section>
            ))}

            <div className="system-settings__actions">
              <Button text="Save" variant="primary" />
            </div>
          </div>
        ) : (
          <div className="system-settings__placeholder">Coming soon.</div>
        )}
      </div>
    </div>
  );
}
