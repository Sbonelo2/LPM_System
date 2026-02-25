import { useEffect, useMemo, useState } from "react";
import AdminTopBar from "../components/AdminTopBar";
import Card from "../components/Card";
import Button from "../components/Button";
import TableComponent, { type TableColumn } from "../components/TableComponent";
import Modal from "../components/Modal";
import InputField from "../components/InputField";
import Dropdown, { type DropdownOption } from "../components/Dropdown";
import Snackbar from "../components/Snackbar";
import LoadingSpinner from "../components/LoadingSpinner";
import { supabase } from "../services/supabaseClient";
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

type NotificationSettingRow = {
  id: string;
  title: string;
  channel: NotificationChannel;
  recipients: Record<string, boolean>;
  subject: string;
  message: string;
  enabled: boolean;
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

export default function SystemSettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [activeTab, setActiveTab] = useState<
    | "notification"
    | "required_documents"
    | "compliance_rules"
    | "security_params"
  >("notification");

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
    const expiryDate = newExpiryDate.trim();

    if (!docName || !formats || !maxSize || !expiryDate) {
      setAddRuleError("Please fill in all fields.");
      return;
    }

    setRequiredDocsRulesByRole((prev) => ({
      ...prev,
      [requiredDocsRole]: [
        {
          documentName: docName,
          required: newRequired,
          formats,
          maxSize,
          expiryDate,
        },
        ...prev[requiredDocsRole],
      ],
    }));

    closeAddRuleModal();
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

    if (!ruleName || !appliesTo || !type || !size) {
      setAddComplianceError("Please fill in all fields.");
      return;
    }

    setComplianceRulesByArea((prev) => ({
      ...prev,
      [complianceArea]: [
        { ruleName, appliesTo, type, size },
        ...prev[complianceArea],
      ],
    }));
    closeAddComplianceModal();
  };

  const updatePermission = (
    role: SecurityRole,
    key: keyof RolePermissions,
    value: boolean,
  ) => {
    setSecurityPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: value,
      },
    }));
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
  };

  const handleCloseSnackbar = () => {
    setSnackbarMessage("");
  };

  const parseMaxSizeMb = (value: string): number => {
    const trimmed = value.trim();
    const match = trimmed.match(/(\d+)/);
    if (!match) return 5;
    return Number(match[1]);
  };

  const loadFromSupabase = async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        supabase
          .from("notification_settings")
          .select("id, title, channel, recipients, subject, message, enabled")
          .order("id", { ascending: true }),
        supabase
          .from("required_document_rules")
          .select(
            "id, applies_to_role, document_name, required, allowed_formats, max_size_mb, expiry_required",
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("compliance_rules")
          .select("id, area, rule_name, applies_to, doc_type, max_size_mb")
          .order("created_at", { ascending: false }),
        supabase
          .from("security_permissions")
          .select(
            "role_key, view_learner_data, submit_assessments, approve_documents",
          ),
        supabase
          .from("app_settings")
          .select("key, value")
          .eq("key", "auth_method")
          .maybeSingle(),
      ]);

      const notificationRes = results[0];
      if (notificationRes.status === "fulfilled") {
        const { data, error: notifError } = notificationRes.value;
        if (!notifError && (data?.length ?? 0) > 0) {
          const mapped = (data as NotificationSettingRow[]).map((row) => ({
            id: row.id,
            title: row.title,
            channel: row.channel,
            recipients: {
              ...DEFAULT_RECIPIENTS,
              ...row.recipients,
            } as Record<RecipientKey, boolean>,
            subject: row.subject,
            message: row.message,
          }));
          setSettings(mapped);
        }
      }

      const requiredRes = results[1];
      if (requiredRes.status === "fulfilled") {
        const { data, error: requiredError } = requiredRes.value;
        if (!requiredError && data) {
          const next: RequiredDocsState = {
            learners: [],
            facilitators: [],
            qa_officers: [],
            programme_coordinators: [],
          };

          (
            data as Array<{
              applies_to_role: string;
              document_name: string;
              required: boolean;
              allowed_formats: string;
              max_size_mb: number;
              expiry_required: boolean;
            }>
          ).forEach((row) => {
            const role = row.applies_to_role as RequiredDocumentsRole;
            if (!next[role]) return;
            next[role].push({
              documentName: row.document_name,
              required: row.required ? "Yes" : "No",
              formats: row.allowed_formats,
              maxSize: `${row.max_size_mb}MB`,
              expiryDate: row.expiry_required ? "Yes" : "N/A",
            });
          });

          setRequiredDocsRulesByRole((prev) => ({
            ...prev,
            ...next,
          }));
        }
      }

      const complianceRes = results[2];
      if (complianceRes.status === "fulfilled") {
        const { data, error: complianceError } = complianceRes.value;
        if (!complianceError && data) {
          const next: ComplianceRulesState = {
            learner_placements: [],
            assessments: [],
            document_submissions: [],
            host_compliance: [],
          };

          (
            data as Array<{
              area: ComplianceArea;
              rule_name: string;
              applies_to: string;
              doc_type: string | null;
              max_size_mb: number | null;
            }>
          ).forEach((row) => {
            next[row.area].push({
              ruleName: row.rule_name,
              appliesTo: row.applies_to,
              type: row.doc_type ?? "",
              size: row.max_size_mb ? `${row.max_size_mb}MB` : "",
            });
          });

          setComplianceRulesByArea(next);
        }
      }

      const securityRes = results[3];
      if (securityRes.status === "fulfilled") {
        const { data, error: securityError } = securityRes.value;
        if (!securityError && data) {
          const next = { ...securityPermissions };
          (
            data as Array<{
              role_key: string;
              view_learner_data: boolean;
              submit_assessments: boolean;
              approve_documents: boolean;
            }>
          ).forEach((row) => {
            const key = row.role_key as SecurityRole;
            if (!next[key]) return;
            next[key] = {
              viewLearnerData: row.view_learner_data,
              submitAssessments: row.submit_assessments,
              approveDocuments: row.approve_documents,
            };
          });
          setSecurityPermissions(next);
        }
      }

      const authMethodRes = results[4];
      if (authMethodRes.status === "fulfilled") {
        const { data, error: appError } = authMethodRes.value;
        if (!appError && data?.value?.method) {
          const method = data.value.method as AuthMethod;
          setAuthMethod(method);
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    const rows = settings.map((setting) => ({
      id: setting.id,
      title: setting.title,
      channel: setting.channel,
      recipients: setting.recipients,
      subject: setting.subject,
      message: setting.message,
      enabled: true,
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await supabase
      .from("notification_settings")
      .upsert(rows, { onConflict: "id" });

    if (upsertError) {
      showSnackbar(`Save failed: ${upsertError.message}`);
      return;
    }

    showSnackbar("Notification settings saved.");
  };

  const saveRequiredDocuments = async () => {
    const rows = (
      Object.entries(requiredDocsRulesByRole) as Array<
        [RequiredDocumentsRole, RequiredDocumentRule[]]
      >
    ).flatMap(([role, rules]) =>
      rules.map((rule) => ({
        applies_to_role: role,
        document_name: rule.documentName,
        required: rule.required === "Yes",
        allowed_formats: rule.formats,
        max_size_mb: parseMaxSizeMb(rule.maxSize),
        expiry_required: rule.expiryDate !== "N/A" && rule.expiryDate !== "No",
      })),
    );

    const { error: insertError } = await supabase
      .from("required_document_rules")
      .insert(rows);

    if (insertError) {
      showSnackbar(`Save failed: ${insertError.message}`);
      return;
    }

    showSnackbar("Required documents saved (new rules appended).");
  };

  const saveComplianceRules = async () => {
    const rows = (
      Object.entries(complianceRulesByArea) as Array<
        [ComplianceArea, ComplianceRule[]]
      >
    ).flatMap(([area, rules]) =>
      rules.map((rule) => ({
        area,
        rule_name: rule.ruleName,
        applies_to: rule.appliesTo,
        doc_type: rule.type,
        max_size_mb: parseMaxSizeMb(rule.size),
      })),
    );

    const { error: insertError } = await supabase
      .from("compliance_rules")
      .insert(rows);

    if (insertError) {
      showSnackbar(`Save failed: ${insertError.message}`);
      return;
    }

    showSnackbar("Compliance rules saved (new rules appended).");
  };

  const saveSecurityParams = async () => {
    const perms = (
      Object.entries(securityPermissions) as Array<
        [SecurityRole, RolePermissions]
      >
    ).map(([role, value]) => ({
      role_key: role,
      view_learner_data: value.viewLearnerData,
      submit_assessments: value.submitAssessments,
      approve_documents: value.approveDocuments,
      updated_at: new Date().toISOString(),
    }));

    const { error: permError } = await supabase
      .from("security_permissions")
      .upsert(perms, { onConflict: "role_key" });

    if (permError) {
      showSnackbar(`Save failed: ${permError.message}`);
      return;
    }

    const { error: appError } = await supabase.from("app_settings").upsert(
      {
        key: "auth_method",
        value: { method: authMethod },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    if (appError) {
      showSnackbar(`Save failed: ${appError.message}`);
      return;
    }

    showSnackbar("Security parameters saved.");
  };

  useEffect(() => {
    loadFromSupabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

        {loading ? (
          <LoadingSpinner message="Loading settings..." />
        ) : error ? (
          <p style={{ marginTop: 12, color: "var(--secondary-color)" }}>
            {error}
          </p>
        ) : activeTab === "notification" ? (
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
              <Button
                text="Save"
                variant="primary"
                onClick={saveNotificationSettings}
              />
            </div>
          </div>
        ) : activeTab === "required_documents" ? (
          <div className="system-settings__content">
            <div className="required-documents__layout">
              <Card className="required-documents__role-card">
                <div className="system-settings__card-title">Select Role</div>
                <div className="system-settings__radio-group" role="radiogroup">
                  <label className="system-settings__option">
                    <input
                      type="radio"
                      name="required-docs-role"
                      checked={requiredDocsRole === "learners"}
                      onChange={() => setRequiredDocsRole("learners")}
                    />
                    <span>Learners</span>
                  </label>
                  <label className="system-settings__option">
                    <input
                      type="radio"
                      name="required-docs-role"
                      checked={requiredDocsRole === "facilitators"}
                      onChange={() => setRequiredDocsRole("facilitators")}
                    />
                    <span>Facilitators</span>
                  </label>
                  <label className="system-settings__option">
                    <input
                      type="radio"
                      name="required-docs-role"
                      checked={requiredDocsRole === "qa_officers"}
                      onChange={() => setRequiredDocsRole("qa_officers")}
                    />
                    <span>QA Officers</span>
                  </label>
                  <label className="system-settings__option">
                    <input
                      type="radio"
                      name="required-docs-role"
                      checked={requiredDocsRole === "programme_coordinators"}
                      onChange={() =>
                        setRequiredDocsRole("programme_coordinators")
                      }
                    />
                    <span>Programme Coordinators</span>
                  </label>
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
              <Button
                text="Save"
                variant="primary"
                onClick={saveRequiredDocuments}
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
                  label="Max Size"
                  value={newMaxSize}
                  onChange={setNewMaxSize}
                  placeholder="e.g. 5MB"
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
              <Button
                text="Save"
                variant="primary"
                onClick={saveComplianceRules}
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
                  required
                />
                <InputField
                  label="Size"
                  value={newComplianceSize}
                  onChange={setNewComplianceSize}
                  placeholder="e.g. 5MB"
                  required
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
              <Button
                text="Save"
                variant="primary"
                onClick={saveSecurityParams}
              />
            </div>
          </div>
        ) : (
          <div className="system-settings__placeholder">Coming soon.</div>
        )}
      </div>

      <Snackbar message={snackbarMessage} onClose={handleCloseSnackbar} />
    </div>
  );
}
