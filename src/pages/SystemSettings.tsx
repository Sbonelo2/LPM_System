import { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import TableComponent, { type TableColumn } from "../components/TableComponent";
import Modal from "../components/Modal";
import InputField from "../components/InputField";
import Dropdown, { type DropdownOption } from "../components/Dropdown";
import "./Dashboard.css";
import "./SystemSettings.css";
import { supabase } from "../services/supabaseClient";

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

type RequiredDocumentsRole =
  | "learners"
  | "facilitators"
  | "qa_officers"
  | "programme_coordinators";

type RequiredDocumentRule = {
  documentName: string;
  required: string;
  formats: string;
  maxSize: string;
  expiryDate: string;
};

type RequiredDocsState = Record<RequiredDocumentsRole, RequiredDocumentRule[]>;

type ComplianceArea =
  | "learner_placements"
  | "assessments"
  | "document_submissions"
  | "host_compliance";

type ComplianceRule = {
  ruleName: string;
  appliesTo: string;
  type: string;
  size: string;
};

type ComplianceRulesState = Record<ComplianceArea, ComplianceRule[]>;

type SecurityRole = "learners" | "facilitators" | "qa_officers";

type RolePermissions = {
  viewLearnerData: boolean;
  submitAssessments: boolean;
  approveDocuments: boolean;
};

type SecurityPermissionsState = Record<SecurityRole, RolePermissions>;

type AuthMethod = "email_password" | "sso";

const DEFAULT_RECIPIENTS: Record<RecipientKey, boolean> = {
  all_admins: false,
  qa_officer: false,
  learners: true,
  facilitators: false,
};

const withTimeout = async <T,>(
  promise: PromiseLike<T>,
  ms: number,
  label: string,
): Promise<T> =>
  Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_resolve, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), ms),
    ),
  ]);

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState<
    | "notification"
    | "required_documents"
    | "compliance_rules"
    | "security_params"
  >("notification");

  const [saveStatus, setSaveStatus] = useState<
    "" | "saving" | "saved" | "error"
  >("");

  const [requiredDocsRole, setRequiredDocsRole] =
    useState<RequiredDocumentsRole>("learners");

  const [complianceArea, setComplianceArea] =
    useState<ComplianceArea>("learner_placements");

  const [complianceRulesByArea, setComplianceRulesByArea] =
    useState<ComplianceRulesState>({
      learner_placements: [
        {
          ruleName: "Learner Id verification",
          appliesTo: "Learner",
          type: "PDF",
          size: "5MB",
        },
        {
          ruleName: "Learner Id verification",
          appliesTo: "Learner",
          type: "DOCS",
          size: "5MB",
        },
        {
          ruleName: "Learner Id verification",
          appliesTo: "Learner",
          type: "PDF",
          size: "5MB",
        },
      ],
      assessments: [
        {
          ruleName: "Assessment submission",
          appliesTo: "Learner",
          type: "PDF",
          size: "5MB",
        },
      ],
      document_submissions: [
        {
          ruleName: "Document upload",
          appliesTo: "Learner",
          type: "PDF",
          size: "5MB",
        },
      ],
      host_compliance: [
        {
          ruleName: "Host onboarding",
          appliesTo: "Host",
          type: "PDF",
          size: "5MB",
        },
      ],
    });

  const [addComplianceModalOpen, setAddComplianceModalOpen] = useState(false);
  const [newComplianceRuleName, setNewComplianceRuleName] = useState("");
  const [newComplianceAppliesTo, setNewComplianceAppliesTo] =
    useState("Learner");
  const [newComplianceType, setNewComplianceType] = useState("PDF");
  const [newComplianceSize, setNewComplianceSize] = useState("5MB");
  const [addComplianceError, setAddComplianceError] = useState("");

  const [securityRole, setSecurityRole] =
    useState<SecurityRole>("facilitators");
  const [securityPermissions, setSecurityPermissions] =
    useState<SecurityPermissionsState>({
      learners: {
        viewLearnerData: true,
        submitAssessments: true,
        approveDocuments: false,
      },
      facilitators: {
        viewLearnerData: true,
        submitAssessments: true,
        approveDocuments: false,
      },
      qa_officers: {
        viewLearnerData: true,
        submitAssessments: false,
        approveDocuments: true,
      },
    });

  const [authMethod, setAuthMethod] = useState<AuthMethod>("email_password");

  const [requiredDocsRulesByRole, setRequiredDocsRulesByRole] =
    useState<RequiredDocsState>({
      learners: [
        {
          documentName: "ID Copy",
          required: "Yes",
          formats: "PDF,JPG",
          maxSize: "5MB",
          expiryDate: "N/A",
        },
        {
          documentName: "Proof of Address",
          required: "Yes",
          formats: "PDF,JPG",
          maxSize: "5MB",
          expiryDate: "N/A",
        },
        {
          documentName: "Consent Form",
          required: "Yes",
          formats: "PDF",
          maxSize: "5MB",
          expiryDate: "N/A",
        },
      ],
      facilitators: [
        {
          documentName: "ID Copy",
          required: "Yes",
          formats: "PDF,JPG",
          maxSize: "5MB",
          expiryDate: "N/A",
        },
        {
          documentName: "Proof of Address",
          required: "Yes",
          formats: "PDF,JPG",
          maxSize: "5MB",
          expiryDate: "N/A",
        },
        {
          documentName: "Consent Form",
          required: "Yes",
          formats: "PDF",
          maxSize: "5MB",
          expiryDate: "N/A",
        },
        {
          documentName: "Facilitator Agreement",
          required: "Yes",
          formats: "PDF",
          maxSize: "5MB",
          expiryDate: "N/A",
        },
      ],
      qa_officers: [
        {
          documentName: "ID Copy",
          required: "Yes",
          formats: "PDF,JPG",
          maxSize: "5MB",
          expiryDate: "N/A",
        },
        {
          documentName: "Proof of Address",
          required: "Yes",
          formats: "PDF,JPG",
          maxSize: "5MB",
          expiryDate: "N/A",
        },
        {
          documentName: "Consent Form",
          required: "Yes",
          formats: "PDF",
          maxSize: "5MB",
          expiryDate: "N/A",
        },
        {
          documentName: "QA Accreditation",
          required: "Yes",
          formats: "PDF",
          maxSize: "5MB",
          expiryDate: "N/A",
        },
      ],
      programme_coordinators: [
        {
          documentName: "ID Copy",
          required: "Yes",
          formats: "PDF,JPG",
          maxSize: "5MB",
          expiryDate: "N/A",
        },
        {
          documentName: "Proof of Address",
          required: "Yes",
          formats: "PDF,JPG",
          maxSize: "5MB",
          expiryDate: "N/A",
        },
        {
          documentName: "Consent Form",
          required: "Yes",
          formats: "PDF",
          maxSize: "5MB",
          expiryDate: "N/A",
        },
        {
          documentName: "Coordinator Appointment Letter",
          required: "Yes",
          formats: "PDF",
          maxSize: "5MB",
          expiryDate: "N/A",
        },
      ],
    });

  const [addRuleModalOpen, setAddRuleModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newRequired, setNewRequired] = useState("Yes");
  const [newFormats, setNewFormats] = useState("");
  const [newMaxSize, setNewMaxSize] = useState("");
  const [newExpiryDate, setNewExpiryDate] = useState("N/A");
  const [addRuleError, setAddRuleError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        // notification_settings
        const { data: notifData } = (await withTimeout(
          supabase
            .from("notification_settings")
            .select("id, title, channel, recipients, subject, message"),
          10000,
          "Load notification settings",
        )) as {
          data:
            | {
                id: string;
                title: string;
                channel: string;
                recipients: Record<string, boolean>;
                subject: string;
                message: string;
              }[]
            | null;
          error: unknown;
        };
        if (notifData && notifData.length > 0) {
          setSettings(
            notifData.map((r) => ({
              id: r.id,
              title: r.title,
              channel: (r.channel as NotificationChannel) ?? "email",
              recipients: (r.recipients as Record<RecipientKey, boolean>) ?? {
                ...DEFAULT_RECIPIENTS,
              },
              subject: r.subject ?? "",
              message: r.message ?? "",
            })),
          );
        }

        // required_document_rules
        const { data: reqData } = (await withTimeout(
          supabase
            .from("required_document_rules")
            .select(
              "applies_to_role, document_name, required, allowed_formats, max_size_mb, expiry_required",
            ),
          10000,
          "Load required document rules",
        )) as {
          data:
            | {
                applies_to_role: string;
                document_name: string;
                required: boolean;
                allowed_formats: string;
                max_size_mb: number | null;
                expiry_required: boolean;
              }[]
            | null;
          error: unknown;
        };
        if (reqData && reqData.length > 0) {
          const grouped: RequiredDocsState = {
            learners: [],
            facilitators: [],
            qa_officers: [],
            programme_coordinators: [],
          };
          reqData.forEach((r) => {
            const role = r.applies_to_role as RequiredDocumentsRole;
            if (grouped[role]) {
              grouped[role].push({
                documentName: r.document_name,
                required: r.required ? "Yes" : "No",
                formats: r.allowed_formats ?? "",
                maxSize: r.max_size_mb != null ? `${r.max_size_mb} MB` : "N/A",
                expiryDate: r.expiry_required ? "Required" : "N/A",
              });
            }
          });
          setRequiredDocsRulesByRole(grouped);
        }

        // compliance_rules
        const { data: compData } = (await withTimeout(
          supabase
            .from("compliance_rules")
            .select("area, rule_name, applies_to, doc_type, max_size_mb"),
          10000,
          "Load compliance rules",
        )) as {
          data:
            | {
                area: string;
                rule_name: string;
                applies_to: string;
                doc_type: string | null;
                max_size_mb: number | null;
              }[]
            | null;
          error: unknown;
        };
        if (compData && compData.length > 0) {
          const grouped: ComplianceRulesState = {
            learner_placements: [],
            assessments: [],
            document_submissions: [],
            host_compliance: [],
          };
          compData.forEach((r) => {
            const area = r.area as ComplianceArea;
            if (grouped[area]) {
              grouped[area].push({
                ruleName: r.rule_name,
                appliesTo: r.applies_to ?? "",
                type: r.doc_type ?? "",
                size: r.max_size_mb != null ? `${r.max_size_mb} MB` : "N/A",
              });
            }
          });
          setComplianceRulesByArea(grouped);
        }

        // security_permissions
        const { data: secData } = (await withTimeout(
          supabase
            .from("security_permissions")
            .select(
              "role_key, view_learner_data, submit_assessments, approve_documents",
            ),
          10000,
          "Load security permissions",
        )) as {
          data:
            | {
                role_key: string;
                view_learner_data: boolean;
                submit_assessments: boolean;
                approve_documents: boolean;
              }[]
            | null;
          error: unknown;
        };
        if (secData && secData.length > 0) {
          const perms = { ...securityPermissions };
          secData.forEach((r) => {
            const role = r.role_key as SecurityRole;
            if (perms[role] !== undefined) {
              perms[role] = {
                viewLearnerData: r.view_learner_data,
                submitAssessments: r.submit_assessments,
                approveDocuments: r.approve_documents,
              };
            }
          });
          setSecurityPermissions(perms);
        }
      } catch (_) {
        /* fall back to defaults */
      }
    };
    void load();
  }, []);

  const saveNotificationSettings = async () => {
    setSaveStatus("saving");
    try {
      const rows = settings.map((s) => ({
        id: s.id,
        title: s.title,
        channel: s.channel,
        recipients: s.recipients,
        subject: s.subject,
        message: s.message,
        enabled: true,
      }));
      const { error } = (await withTimeout(
        supabase
          .from("notification_settings")
          .upsert(rows, { onConflict: "id" }),
        10000,
        "Save notification settings",
      )) as { error: { message: string } | null };
      if (error) throw new Error(error.message);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2500);
    } catch (e) {
      setSaveStatus("error");
      alert(`Save failed: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  };

  const saveSecurityPermissions = async () => {
    setSaveStatus("saving");
    try {
      for (const role of Object.keys(securityPermissions) as SecurityRole[]) {
        const p = securityPermissions[role];
        const { error } = (await withTimeout(
          supabase
            .from("security_permissions")
            .update({
              view_learner_data: p.viewLearnerData,
              submit_assessments: p.submitAssessments,
              approve_documents: p.approveDocuments,
            })
            .eq("role_key", role),
          10000,
          `Save security ${role}`,
        )) as { error: { message: string } | null };
        if (error) throw new Error(error.message);
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2500);
    } catch (e) {
      setSaveStatus("error");
      alert(`Save failed: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  };

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

  const requiredDocumentsColumns: TableColumn<RequiredDocumentRule>[] = useMemo(
    () => [
      { key: "documentName", header: "Document name" },
      { key: "required", header: "Required" },
      { key: "formats", header: "Format(s)" },
      { key: "maxSize", header: "Max Size" },
      { key: "expiryDate", header: "Expiry Date" },
    ],
    [],
  );

  const requiredDocumentsData: RequiredDocumentRule[] =
    requiredDocsRulesByRole[requiredDocsRole];

  const complianceColumns: TableColumn<ComplianceRule>[] = useMemo(
    () => [
      { key: "ruleName", header: "Rule name" },
      { key: "appliesTo", header: "Applies To" },
      { key: "type", header: "Type" },
      { key: "size", header: "Size" },
    ],
    [],
  );

  const complianceData: ComplianceRule[] =
    complianceRulesByArea[complianceArea];

  const requiredOptions: DropdownOption[] = useMemo(
    () => [
      { label: "Yes", value: "Yes" },
      { label: "No", value: "No" },
    ],
    [],
  );

  const openAddRuleModal = () => {
    setAddRuleError("");
    setNewDocName("");
    setNewRequired("Yes");
    setNewFormats("");
    setNewMaxSize("");
    setNewExpiryDate("N/A");
    setAddRuleModalOpen(true);
  };

  const closeAddRuleModal = () => {
    setAddRuleModalOpen(false);
    setAddRuleError("");
  };

  const saveNewRule = () => {
    const docName = newDocName.trim();
    const formats = newFormats.trim();
    const maxSize = newMaxSize.trim();

    if (!docName || !formats || !maxSize) {
      setAddRuleError("Please fill in all required fields.");
      return;
    }

    const requiredBool = newRequired === "Yes";
    const maxSizeMb = parseInt(maxSize.replace(/[^0-9]/g, ""), 10) || 5;
    const expiryDate = newExpiryDate.trim();
    const expiryRequired = expiryDate !== "N/A" && expiryDate.length > 0;

    const insert = async () => {
      try {
        const { error } = (await withTimeout(
          supabase.from("required_document_rules").insert({
            applies_to_role: requiredDocsRole,
            document_name: docName,
            required: requiredBool,
            allowed_formats: formats,
            max_size_mb: maxSizeMb,
            expiry_required: expiryRequired,
          }),
          10000,
          "Add required document rule",
        )) as { error: { message: string } | null };
        if (error) throw new Error(error.message);
        setRequiredDocsRulesByRole((prev) => ({
          ...prev,
          [requiredDocsRole]: [
            {
              documentName: docName,
              required: newRequired,
              formats,
              maxSize: `${maxSizeMb} MB`,
              expiryDate: expiryRequired ? "Required" : "N/A",
            },
            ...prev[requiredDocsRole],
          ],
        }));
        closeAddRuleModal();
      } catch (e) {
        setAddRuleError(e instanceof Error ? e.message : "Save failed");
      }
    };
    void insert();
  };

  const openAddComplianceModal = () => {
    setAddComplianceError("");
    setNewComplianceRuleName("");
    setNewComplianceAppliesTo("Learner");
    setNewComplianceType("PDF");
    setNewComplianceSize("5MB");
    setAddComplianceModalOpen(true);
  };

  const closeAddComplianceModal = () => {
    setAddComplianceModalOpen(false);
    setAddComplianceError("");
  };

  const saveNewComplianceRule = () => {
    const ruleName = newComplianceRuleName.trim();
    const appliesTo = newComplianceAppliesTo.trim();
    const type = newComplianceType.trim();
    const size = newComplianceSize.trim();

    if (!ruleName || !appliesTo) {
      setAddComplianceError("Please fill in all required fields.");
      return;
    }

    const maxSizeMb = parseInt(size.replace(/[^0-9]/g, ""), 10) || null;

    const insert = async () => {
      try {
        const { error } = (await withTimeout(
          supabase.from("compliance_rules").insert({
            area: complianceArea,
            rule_name: ruleName,
            applies_to: appliesTo,
            doc_type: type || null,
            max_size_mb: maxSizeMb,
          }),
          10000,
          "Add compliance rule",
        )) as { error: { message: string } | null };
        if (error) throw new Error(error.message);
        setComplianceRulesByArea((prev) => ({
          ...prev,
          [complianceArea]: [
            { ruleName, appliesTo, type, size },
            ...prev[complianceArea],
          ],
        }));
        closeAddComplianceModal();
      } catch (e) {
        setAddComplianceError(e instanceof Error ? e.message : "Save failed");
      }
    };
    void insert();
  };

  const updatePermission = (
    role: SecurityRole,
    key: keyof RolePermissions,
    value: boolean,
  ) => {
    setSecurityPermissions((prev) => ({
      ...prev,
      [role]: { ...prev[role], [key]: value },
    }));
  };

  return (
    <>
      <div className="facilitator-dashboard-content">
        <div className="dashboard-header">
          <h2>SYSTEM SETTINGS</h2>
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
                      {(["email", "sms", "in_app"] as const).map((ch) => (
                        <label key={ch} className="system-settings__option">
                          <input
                            type="radio"
                            name={`${setting.id}-channel`}
                            checked={setting.channel === ch}
                            onChange={() =>
                              handleSettingUpdate(setting.id, (prev) => ({
                                ...prev,
                                channel: ch,
                              }))
                            }
                          />
                          <span>
                            {ch === "in_app"
                              ? "In-App"
                              : ch.charAt(0).toUpperCase() + ch.slice(1)}
                          </span>
                        </label>
                      ))}
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
              {saveStatus === "saving" && (
                <span style={{ marginRight: 12, color: "#888" }}>Saving…</span>
              )}
              {saveStatus === "saved" && (
                <span style={{ marginRight: 12, color: "green" }}>Saved!</span>
              )}
              {saveStatus === "error" && (
                <span style={{ marginRight: 12, color: "red" }}>
                  Save failed
                </span>
              )}
              <Button
                text="Save"
                variant="primary"
                onClick={() => void saveNotificationSettings()}
              />
            </div>
          </div>
        ) : activeTab === "required_documents" ? (
          <div className="system-settings__content">
            <div className="required-documents__layout">
              <Card className="required-documents__role-card">
                <div className="system-settings__card-title">Select Role</div>
                <div className="system-settings__radio-group" role="radiogroup">
                  {(
                    [
                      "learners",
                      "facilitators",
                      "qa_officers",
                      "programme_coordinators",
                    ] as const
                  ).map((role) => (
                    <label key={role} className="system-settings__option">
                      <input
                        type="radio"
                        name="required-docs-role"
                        checked={requiredDocsRole === role}
                        onChange={() => setRequiredDocsRole(role)}
                      />
                      <span>
                        {role === "programme_coordinators"
                          ? "Programme Coordinators"
                          : role === "qa_officers"
                            ? "QA Officers"
                            : role.charAt(0).toUpperCase() + role.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </Card>

              <Card className="required-documents__table-card">
                <TableComponent
                  columns={requiredDocumentsColumns}
                  data={requiredDocumentsData}
                  caption="Required documents rules"
                />
              </Card>
            </div>

            <div className="system-settings__actions">
              <Button
                text="Add a rule"
                variant="primary"
                onClick={openAddRuleModal}
              />
            </div>

            <Modal
              isOpen={addRuleModalOpen}
              onClose={closeAddRuleModal}
              title="Add Required Document Rule"
            >
              <div className="required-documents__modal-form">
                <InputField
                  label="Document name"
                  value={newDocName}
                  onChange={setNewDocName}
                  placeholder="e.g. ID Copy"
                  required
                />
                <Dropdown
                  label="Required"
                  value={newRequired}
                  onChange={setNewRequired}
                  options={requiredOptions}
                />
                <InputField
                  label="Format(s)"
                  value={newFormats}
                  onChange={setNewFormats}
                  placeholder="e.g. PDF,JPG"
                  required
                />
                <InputField
                  label="Max Size (MB)"
                  value={newMaxSize}
                  onChange={setNewMaxSize}
                  placeholder="e.g. 5"
                  required
                />
                <InputField
                  label="Expiry Date"
                  value={newExpiryDate}
                  onChange={setNewExpiryDate}
                  placeholder="e.g. N/A or 2026-12-31"
                  required
                />

                {addRuleError && (
                  <p className="required-documents__modal-error">
                    {addRuleError}
                  </p>
                )}

                <div className="required-documents__modal-actions">
                  <Button
                    text="Cancel"
                    variant="secondary"
                    onClick={closeAddRuleModal}
                  />
                  <Button text="Save" variant="primary" onClick={saveNewRule} />
                </div>
              </div>
            </Modal>
          </div>
        ) : activeTab === "compliance_rules" ? (
          <div className="system-settings__content">
            <div className="compliance__layout">
              <Card className="compliance__area-card">
                <div className="system-settings__card-title">
                  Select Compliance Area
                </div>
                <div className="system-settings__radio-group" role="radiogroup">
                  <label className="system-settings__option">
                    <input
                      type="radio"
                      name="compliance-area"
                      checked={complianceArea === "learner_placements"}
                      onChange={() => setComplianceArea("learner_placements")}
                    />
                    <span>Learner Placements</span>
                  </label>
                  <label className="system-settings__option">
                    <input
                      type="radio"
                      name="compliance-area"
                      checked={complianceArea === "assessments"}
                      onChange={() => setComplianceArea("assessments")}
                    />
                    <span>Assessments</span>
                  </label>
                  <label className="system-settings__option">
                    <input
                      type="radio"
                      name="compliance-area"
                      checked={complianceArea === "document_submissions"}
                      onChange={() => setComplianceArea("document_submissions")}
                    />
                    <span>Document Submissions</span>
                  </label>
                  <label className="system-settings__option">
                    <input
                      type="radio"
                      name="compliance-area"
                      checked={complianceArea === "host_compliance"}
                      onChange={() => setComplianceArea("host_compliance")}
                    />
                    <span>Host Compliance</span>
                  </label>
                </div>
              </Card>

              <Card className="compliance__table-card">
                <TableComponent
                  columns={complianceColumns}
                  data={complianceData}
                  caption="Compliance rules"
                />
              </Card>
            </div>

            <div className="system-settings__actions">
              <Button
                text="Add a rule"
                variant="primary"
                onClick={openAddComplianceModal}
              />
            </div>

            <Modal
              isOpen={addComplianceModalOpen}
              onClose={closeAddComplianceModal}
              title="Add Compliance Rule"
            >
              <div className="required-documents__modal-form">
                <InputField
                  label="Rule name"
                  value={newComplianceRuleName}
                  onChange={setNewComplianceRuleName}
                  placeholder="e.g. Learner Id verification"
                  required
                />
                <InputField
                  label="Applies To"
                  value={newComplianceAppliesTo}
                  onChange={setNewComplianceAppliesTo}
                  placeholder="e.g. Learner"
                  required
                />
                <InputField
                  label="Type"
                  value={newComplianceType}
                  onChange={setNewComplianceType}
                  placeholder="e.g. PDF"
                />
                <InputField
                  label="Size (MB)"
                  value={newComplianceSize}
                  onChange={setNewComplianceSize}
                  placeholder="e.g. 5"
                />

                {addComplianceError && (
                  <p className="required-documents__modal-error">
                    {addComplianceError}
                  </p>
                )}

                <div className="required-documents__modal-actions">
                  <Button
                    text="Cancel"
                    variant="secondary"
                    onClick={closeAddComplianceModal}
                  />
                  <Button
                    text="Save"
                    variant="primary"
                    onClick={saveNewComplianceRule}
                  />
                </div>
              </div>
            </Modal>
          </div>
        ) : activeTab === "security_params" ? (
          <div className="system-settings__content">
            <div className="security__header">
              <div className="security__role-label">
                Role :{" "}
                {securityRole === "learners"
                  ? "Learners"
                  : securityRole === "facilitators"
                    ? "Facilitators"
                    : "QA Officers"}
              </div>
              <div className="security__role-switch">
                <label className="system-settings__option">
                  <input
                    type="radio"
                    name="security-role"
                    checked={securityRole === "learners"}
                    onChange={() => setSecurityRole("learners")}
                  />
                  <span>Learners</span>
                </label>
                <label className="system-settings__option">
                  <input
                    type="radio"
                    name="security-role"
                    checked={securityRole === "facilitators"}
                    onChange={() => setSecurityRole("facilitators")}
                  />
                  <span>Facilitators</span>
                </label>
                <label className="system-settings__option">
                  <input
                    type="radio"
                    name="security-role"
                    checked={securityRole === "qa_officers"}
                    onChange={() => setSecurityRole("qa_officers")}
                  />
                  <span>QA Officers</span>
                </label>
              </div>
            </div>

            <div className="security__cards">
              {(
                [
                  { key: "learners", label: "Learners" },
                  { key: "facilitators", label: "Facilitators" },
                  { key: "qa_officers", label: "QA Officers" },
                ] as const
              ).map((role) => (
                <Card key={role.key} className="security__card">
                  <div className="security__card-title">
                    Role : {role.label}
                  </div>
                  <div className="security__card-subtitle">Permissions :</div>
                  <div className="system-settings__checkbox-group">
                    <label className="system-settings__option">
                      <input
                        type="checkbox"
                        checked={securityPermissions[role.key].viewLearnerData}
                        onChange={(e) =>
                          updatePermission(
                            role.key,
                            "viewLearnerData",
                            e.target.checked,
                          )
                        }
                      />
                      <span>View learner Data</span>
                    </label>
                    <label className="system-settings__option">
                      <input
                        type="checkbox"
                        checked={
                          securityPermissions[role.key].submitAssessments
                        }
                        onChange={(e) =>
                          updatePermission(
                            role.key,
                            "submitAssessments",
                            e.target.checked,
                          )
                        }
                      />
                      <span>Submit Assessments</span>
                    </label>
                    <label className="system-settings__option">
                      <input
                        type="checkbox"
                        checked={securityPermissions[role.key].approveDocuments}
                        onChange={(e) =>
                          updatePermission(
                            role.key,
                            "approveDocuments",
                            e.target.checked,
                          )
                        }
                      />
                      <span>Approve Documents</span>
                    </label>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="security__auth-card">
              <div className="system-settings__card-title">
                Authentication Settings
              </div>
              <div className="system-settings__radio-group" role="radiogroup">
                <label className="system-settings__option">
                  <input
                    type="radio"
                    name="auth-method"
                    checked={authMethod === "email_password"}
                    onChange={() => setAuthMethod("email_password")}
                  />
                  <span>Email and Password</span>
                </label>
                <label className="system-settings__option">
                  <input
                    type="radio"
                    name="auth-method"
                    checked={authMethod === "sso"}
                    onChange={() => setAuthMethod("sso")}
                  />
                  <span>Single Sign-On</span>
                </label>
              </div>
            </Card>

            <div className="system-settings__actions">
              {saveStatus === "saving" && (
                <span style={{ marginRight: 12, color: "#888" }}>Saving…</span>
              )}
              {saveStatus === "saved" && (
                <span style={{ marginRight: 12, color: "green" }}>Saved!</span>
              )}
              {saveStatus === "error" && (
                <span style={{ marginRight: 12, color: "red" }}>
                  Save failed
                </span>
              )}
              <Button
                text="Save"
                variant="primary"
                onClick={() => void saveSecurityPermissions()}
              />
            </div>
          </div>
        ) : (
          <div className="system-settings__placeholder">Coming soon.</div>
        )}
      </div>
    </>
  );
}
