import React, { useEffect, useMemo, useState } from "react";
import Card from "../components/Card";
import TableComponent, { type TableColumn } from "../components/TableComponent";
import LoadingSpinner from "../components/LoadingSpinner";
import Snackbar from "../components/Snackbar";
import { supabase } from "../services/supabaseClient";
import "./Dashboard.css";
import "./AdminSystemMonitor.css";

type Service = {
  name: string;
  enabled: boolean;
  uptime: string;
};

type ActiveUserMetric = {
  metric: string;
  value: number;
  status: string;
};

type ErrorMetric = {
  type: string;
  count: number;
  severity: "high" | "medium" | "low";
};

type QaIssueRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
};

type VerificationRow = {
  id: string;
  document_id: string;
  status: string;
  created_at: string;
};

const AdminSystemMonitor: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceWindow, setMaintenanceWindow] = useState<string>("");

  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [placementsCount, setPlacementsCount] = useState(0);
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState(0);
  const [openIssuesCount, setOpenIssuesCount] = useState(0);

  const [recentIssues, setRecentIssues] = useState<QaIssueRow[]>([]);
  const [recentVerifications, setRecentVerifications] = useState<
    VerificationRow[]
  >([]);

  const [services, setServices] = useState<Service[]>([
    { name: "Authentication Service", enabled: true, uptime: "—" },
    { name: "Notifications Service", enabled: true, uptime: "—" },
    { name: "Document Storage", enabled: true, uptime: "—" },
  ]);

  const systemHealth = useMemo(() => {
    const healthStatus = maintenanceEnabled ? "Maintenance" : "Healthy";
    const updatesPercent = maintenanceEnabled ? 0 : 100;
    const lastDowntime = maintenanceEnabled
      ? maintenanceWindow || "Maintenance enabled"
      : "No downtime recorded";
    return { healthStatus, updatesPercent, lastDowntime };
  }, [maintenanceEnabled, maintenanceWindow]);

  const activeUsers: ActiveUserMetric[] = useMemo(
    () => [
      {
        metric: "Active Users",
        value: activeUsersCount,
        status: maintenanceEnabled ? "Limited" : "Stable",
      },
      {
        metric: "Placements",
        value: placementsCount,
        status: "Normal",
      },
      {
        metric: "Pending Verifications",
        value: pendingVerificationsCount,
        status: pendingVerificationsCount > 0 ? "Needs attention" : "Clear",
      },
    ],
    [
      activeUsersCount,
      maintenanceEnabled,
      pendingVerificationsCount,
      placementsCount,
    ],
  );

  const errorMetrics: ErrorMetric[] = useMemo(
    () => [
      {
        type: "Open QA Issues",
        count: openIssuesCount,
        severity:
          openIssuesCount > 10
            ? "high"
            : openIssuesCount > 0
              ? "medium"
              : "low",
      },
      {
        type: "Pending Verifications",
        count: pendingVerificationsCount,
        severity:
          pendingVerificationsCount > 20
            ? "high"
            : pendingVerificationsCount > 0
              ? "medium"
              : "low",
      },
      {
        type: "Maintenance Mode",
        count: maintenanceEnabled ? 1 : 0,
        severity: maintenanceEnabled ? "medium" : "low",
      },
    ],
    [maintenanceEnabled, openIssuesCount, pendingVerificationsCount],
  );

  const peakUsers = Math.max(1, ...activeUsers.map((item) => item.value));
  const maxErrorCount = Math.max(1, ...errorMetrics.map((item) => item.count));

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
  };

  const handleCloseSnackbar = () => {
    setSnackbarMessage("");
  };

  const loadMonitoringData = async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      supabase
        .from("maintenance_settings")
        .select("status, scheduled_start, scheduled_end")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase.from("placements").select("id", { count: "exact", head: true }),
      supabase
        .from("document_verifications")
        .select("id", { count: "exact", head: true })
        .eq("status", "Pending"),
      supabase
        .from("qa_issues")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "pending"]),
      supabase
        .from("qa_issues")
        .select("id, title, status, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("document_verifications")
        .select("id, document_id, status, created_at")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("app_settings")
        .select("key, value")
        .eq("key", "service_flags")
        .maybeSingle(),
    ]);

    const collectErrors: string[] = [];

    const maintenanceRes = results[0];
    if (maintenanceRes.status === "fulfilled") {
      if (maintenanceRes.value.error) {
        collectErrors.push(maintenanceRes.value.error.message);
      } else if (maintenanceRes.value.data) {
        const row = maintenanceRes.value.data as {
          status: string;
          scheduled_start: string | null;
          scheduled_end: string | null;
        };
        setMaintenanceEnabled(String(row.status).toLowerCase() === "active");
        const window =
          row.scheduled_start && row.scheduled_end
            ? `${row.scheduled_start} → ${row.scheduled_end}`
            : "";
        setMaintenanceWindow(window);
      }
    }

    const activeUsersRes = results[1];
    if (activeUsersRes.status === "fulfilled") {
      if (activeUsersRes.value.error) {
        collectErrors.push(activeUsersRes.value.error.message);
      } else {
        setActiveUsersCount(activeUsersRes.value.count ?? 0);
      }
    }

    const placementsRes = results[2];
    if (placementsRes.status === "fulfilled") {
      if (placementsRes.value.error) {
        collectErrors.push(placementsRes.value.error.message);
      } else {
        setPlacementsCount(placementsRes.value.count ?? 0);
      }
    }

    const pendingVerRes = results[3];
    if (pendingVerRes.status === "fulfilled") {
      if (pendingVerRes.value.error) {
        collectErrors.push(pendingVerRes.value.error.message);
      } else {
        setPendingVerificationsCount(pendingVerRes.value.count ?? 0);
      }
    }

    const openIssuesRes = results[4];
    if (openIssuesRes.status === "fulfilled") {
      if (openIssuesRes.value.error) {
        collectErrors.push(openIssuesRes.value.error.message);
      } else {
        setOpenIssuesCount(openIssuesRes.value.count ?? 0);
      }
    }

    const recentIssuesRes = results[5];
    if (recentIssuesRes.status === "fulfilled") {
      if (recentIssuesRes.value.error) {
        collectErrors.push(recentIssuesRes.value.error.message);
      } else {
        setRecentIssues((recentIssuesRes.value.data ?? []) as QaIssueRow[]);
      }
    }

    const recentVerificationsRes = results[6];
    if (recentVerificationsRes.status === "fulfilled") {
      if (recentVerificationsRes.value.error) {
        collectErrors.push(recentVerificationsRes.value.error.message);
      } else {
        setRecentVerifications(
          (recentVerificationsRes.value.data ?? []) as VerificationRow[],
        );
      }
    }

    const serviceFlagsRes = results[7];
    if (serviceFlagsRes.status === "fulfilled") {
      if (!serviceFlagsRes.value.error && serviceFlagsRes.value.data?.value) {
        const flags =
          (serviceFlagsRes.value.data.value as Record<string, boolean>) ?? {};
        setServices((prev) =>
          prev.map((service) => ({
            ...service,
            enabled: flags[service.name] ?? service.enabled,
          })),
        );
      }
    }

    if (collectErrors.length > 0) {
      setError(collectErrors[0]);
    }

    setLoading(false);
  };

  const persistServices = async (nextServices: Service[]) => {
    const flags: Record<string, boolean> = {};
    nextServices.forEach((service) => {
      flags[service.name] = service.enabled;
    });

    const { error: upsertError } = await supabase.from("app_settings").upsert(
      {
        key: "service_flags",
        value: flags,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    if (upsertError) {
      showSnackbar(`Save failed: ${upsertError.message}`);
      return;
    }

    showSnackbar("Service status saved.");
  };

  useEffect(() => {
    loadMonitoringData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const serviceColumns: TableColumn<Service>[] = useMemo(
    () => [
      { key: "name", header: "Service" },
      {
        key: "enabled",
        header: "Status",
        render: (service: Service) => (
          <label className="monitor-toggle">
            <input
              type="checkbox"
              checked={service.enabled}
              onChange={() =>
                setServices((prev) => {
                  const next = prev.map((item) =>
                    item.name === service.name
                      ? { ...item, enabled: !item.enabled }
                      : item,
                  );
                  void persistServices(next);
                  return next;
                })
              }
            />
            <span>{service.enabled ? "Online" : "Offline"}</span>
          </label>
        ),
      },
      { key: "uptime", header: "Uptime" },
    ],
    [],
  );

  const recentIssuesColumns: TableColumn<QaIssueRow>[] = useMemo(
    () => [
      { key: "title", header: "Issue" },
      { key: "status", header: "Status" },
      {
        key: "created_at",
        header: "Created",
        render: (row) => row.created_at?.slice(0, 19).replace("T", " ") ?? "",
      },
    ],
    [],
  );

  const recentVerificationsColumns: TableColumn<VerificationRow>[] = useMemo(
    () => [
      { key: "document_id", header: "Document" },
      { key: "status", header: "Status" },
      {
        key: "created_at",
        header: "Created",
        render: (row) => row.created_at?.slice(0, 19).replace("T", " ") ?? "",
      },
    ],
    [],
  );

  return (
    <>
      <div className="facilitator-dashboard-content">
        <div className="dashboard-header">
          <h2>SYSTEM MONITOR</h2>
          <span
            className="monitor-live-indicator"
            aria-label="System live status"
          >
            <span className="monitor-live-indicator__dot" />
          </span>
        </div>

        <div className="monitor-grid">
          {loading ? (
            <Card>
              <LoadingSpinner message="Loading monitoring..." />
            </Card>
          ) : error ? (
            <Card>
              <h3>System Health</h3>
              <p style={{ marginTop: 12, color: "var(--secondary-color)" }}>
                {error}
              </p>
            </Card>
          ) : (
            <>
              <Card>
                <h3>System Health</h3>
                <div className="monitor-health-list">
                  <div className="monitor-health-item">
                    <span>Health Status</span>
                    <strong className="monitor-status-pill monitor-status-pill--healthy">
                      {systemHealth.healthStatus}
                    </strong>
                  </div>
                  <div className="monitor-health-item">
                    <span>Updates</span>
                    <strong>{systemHealth.updatesPercent}%</strong>
                  </div>
                  <div
                    className="monitor-progress-track"
                    aria-label="Update progress"
                  >
                    <div
                      className="monitor-progress-fill"
                      style={{ width: `${systemHealth.updatesPercent}%` }}
                    />
                  </div>
                  <div className="monitor-health-item">
                    <span>Maintenance</span>
                    <strong>
                      {maintenanceEnabled ? "Enabled" : "Disabled"}
                    </strong>
                  </div>
                  <div className="monitor-health-item">
                    <span>Window</span>
                    <strong>{maintenanceWindow || "—"}</strong>
                  </div>
                  <div className="monitor-health-item">
                    <span>Last Downtime</span>
                    <strong>{systemHealth.lastDowntime}</strong>
                  </div>
                </div>
              </Card>

              <Card>
                <h3>Performance Metrics</h3>
                <div className="monitor-metric-list">
                  {activeUsers.map((metric) => (
                    <div key={metric.metric} className="monitor-metric-item">
                      <div className="monitor-metric-top">
                        <span>{metric.metric}</span>
                        <strong>{metric.value}</strong>
                      </div>
                      <div className="monitor-bar-track" aria-hidden="true">
                        <div
                          className="monitor-bar-fill monitor-bar-fill--users"
                          style={{
                            width: `${(metric.value / peakUsers) * 100}%`,
                          }}
                        />
                      </div>
                      <small>{metric.status}</small>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3>Services</h3>
                <TableComponent
                  columns={serviceColumns}
                  data={services}
                  caption="Service Status Controls"
                />
              </Card>

              <Card>
                <h3>Error Summary</h3>
                <div className="monitor-metric-list">
                  {errorMetrics.map((metric) => (
                    <div key={metric.type} className="monitor-metric-item">
                      <div className="monitor-metric-top">
                        <span>{metric.type}</span>
                        <strong>{metric.count}</strong>
                      </div>
                      <div className="monitor-bar-track" aria-hidden="true">
                        <div
                          className={`monitor-bar-fill monitor-bar-fill--${metric.severity}`}
                          style={{
                            width: `${(metric.count / maxErrorCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3>Recent QA Issues</h3>
                <TableComponent
                  columns={recentIssuesColumns}
                  data={recentIssues}
                  caption="Latest issues"
                />
              </Card>

              <Card>
                <h3>Recent Verifications</h3>
                <TableComponent
                  columns={recentVerificationsColumns}
                  data={recentVerifications}
                  caption="Latest document verification events"
                />
              </Card>
            </>
          )}
        </div>
      </div>

      <Snackbar message={snackbarMessage} onClose={handleCloseSnackbar} />
      </>
  );
};

export default AdminSystemMonitor;
