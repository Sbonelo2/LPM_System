import React, { useEffect, useMemo, useState } from "react";
import "./CoordinatorReports.css";
import DashboardStats from "../components/DashboardStats";
import TableComponent from "../components/TableComponent";
import Dropdown from "../components/Dropdown";
import InputField from "../components/InputField";
import LoadingSpinner from "../components/LoadingSpinner";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../hooks/useAuth";

type PlacementStatus =
  | "Active"
  | "Inactive"
  | "Pending"
  | "Suspended"
  | "Cancelled"
  | "Completed";

type PlacementRow = {
  id: string;
  learnerId: string;
  learnerName: string;
  host: string;
  programme: string;
  status: PlacementStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
};

type AuditAction = "INSERT" | "UPDATE" | "DELETE";

type AuditLogRow = {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_email: string | null;
  action: AuditAction;
  table_name: string;
  record_id: string | null;
  old_data: unknown;
  new_data: unknown;
};

const CoordinatorReports: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"placements" | "audit">(
    "placements",
  );
  const [timePeriod, setTimePeriod] = useState("all");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [actionType, setActionType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [hostsCount, setHostsCount] = useState<number>(0);
  const [learnersCount, setLearnersCount] = useState<number>(0);
  const [actorById, setActorById] = useState<
    Map<string, { displayName: string; role?: string }>
  >(() => new Map());

  const withTimeout = async <T,>(
    promise: PromiseLike<T>,
    ms: number,
    label: string,
  ): Promise<T> => {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_resolve, reject) =>
        setTimeout(() => reject(new Error(`${label} timed out`)), ms),
      ),
    ]);
  };

  const formatRoleLabel = (role?: string): string => {
    if (!role) return "";
    if (role === "super_admin") return "Super Admin";
    if (role === "admin" || role === "facilitator") return "Facilitator";
    if (role === "programme_coordinator") return "Programme Coordinator";
    if (role === "qa_officer") return "QA Officer";
    if (role === "mentor") return "Mentor";
    if (role === "learner") return "Learner";
    return role;
  };

  const formatActorDisplay = (row: AuditLogRow): string => {
    if (!row.actor_id) return "System";

    const actorInfo = actorById.get(row.actor_id);
    const roleLabel = formatRoleLabel(actorInfo?.role);

    return (
      row.actor_email ||
      actorInfo?.displayName ||
      roleLabel ||
      row.actor_id ||
      "Unknown"
    );
  };

  const loadAuditLogs = async () => {
    if (!user) {
      setAuditLogs([]);
      setActorById(new Map());
      return;
    }

    try {
      const { data, error: supaError } = (await withTimeout(
        supabase
          .from("audit_logs")
          .select(
            "id, created_at, actor_id, actor_email, action, table_name, record_id, old_data, new_data",
          )
          .order("created_at", { ascending: false })
          .limit(2000),
        12000,
        "Load audit logs",
      )) as { data: AuditLogRow[] | null; error: { message: string } | null };

      if (supaError) throw new Error(supaError.message);

      const rows = data ?? [];
      setAuditLogs(rows);

      const actorIds = Array.from(
        new Set(rows.map((r) => r.actor_id).filter(Boolean) as string[]),
      );
      if (actorIds.length > 0) {
        try {
          const { data: actorRows, error: actorError } = (await withTimeout(
            supabase
              .from("profiles")
              .select("id, full_name, email, role")
              .in("id", actorIds),
            12000,
            "Load actors",
          )) as {
            data:
              | {
                  id: string;
                  full_name: string | null;
                  email: string | null;
                  role: string | null;
                }[]
              | null;
            error: { message: string } | null;
          };

          if (!actorError) {
            const map = new Map<
              string,
              { displayName: string; role?: string }
            >();
            (actorRows ?? []).forEach((a) => {
              map.set(a.id, {
                displayName: a.full_name ?? a.email ?? a.id,
                role: a.role ?? undefined,
              });
            });
            setActorById(map);
          }
        } catch {
          // ignore
        }
      } else {
        setActorById(new Map());
      }
    } catch (e: unknown) {
      // keep audit trails optional; surface error in UI
      setError((prev) => {
        const msg =
          e instanceof Error ? e.message : "Failed to load audit logs";
        return prev ? `${prev} | ${msg}` : msg;
      });
    }
  };

  const pickLabelFromData = (data: unknown): string => {
    if (!data || typeof data !== "object") return "";
    const obj = data as Record<string, unknown>;
    const candidates = [
      "name",
      "title",
      "file_name",
      "host_name",
      "programme",
      "status",
    ];
    for (const key of candidates) {
      const val = obj[key];
      if (typeof val === "string" && val.trim()) return `${key}: ${val}`;
    }
    return "";
  };

  const formatAuditDetails = (row: AuditLogRow): string => {
    const base =
      row.action === "DELETE"
        ? pickLabelFromData(row.old_data)
        : pickLabelFromData(row.new_data);

    if (row.action !== "UPDATE") {
      return base || (row.record_id ? `record: ${row.record_id}` : "");
    }

    const oldObj =
      row.old_data && typeof row.old_data === "object"
        ? (row.old_data as Record<string, unknown>)
        : null;
    const newObj =
      row.new_data && typeof row.new_data === "object"
        ? (row.new_data as Record<string, unknown>)
        : null;
    if (!oldObj || !newObj) {
      return base || (row.record_id ? `record: ${row.record_id}` : "");
    }

    const ignoreKeys = new Set(["updated_at", "created_at"]);
    const changed: string[] = [];
    Object.keys(newObj).forEach((key) => {
      if (ignoreKeys.has(key)) return;
      const before = oldObj[key];
      const after = newObj[key];
      const beforeStr =
        typeof before === "string" ||
        typeof before === "number" ||
        typeof before === "boolean"
          ? String(before)
          : "";
      const afterStr =
        typeof after === "string" ||
        typeof after === "number" ||
        typeof after === "boolean"
          ? String(after)
          : "";

      if (beforeStr !== afterStr && (beforeStr || afterStr)) {
        changed.push(
          `${key}: ${beforeStr || "(empty)"} → ${afterStr || "(empty)"}`,
        );
      }
    });

    const summary = changed.slice(0, 3).join("; ");
    if (summary) return base ? `${base} | ${summary}` : summary;
    return base || (row.record_id ? `record: ${row.record_id}` : "");
  };

  const loadSummaryCounts = async () => {
    if (!user) {
      setHostsCount(0);
      setLearnersCount(0);
      return;
    }

    try {
      const results = await Promise.allSettled([
        withTimeout(
          supabase.from("hosts").select("id", { count: "exact", head: true }),
          12000,
          "Load hosts count",
        ),
        withTimeout(
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "learner"),
          12000,
          "Load learners count",
        ),
      ]);

      const hostsRes = results[0];
      const learnersRes = results[1];

      const hc =
        hostsRes.status === "fulfilled" && !hostsRes.value.error
          ? (hostsRes.value.count ?? 0)
          : 0;
      const lc =
        learnersRes.status === "fulfilled" && !learnersRes.value.error
          ? (learnersRes.value.count ?? 0)
          : 0;

      setHostsCount(hc);
      setLearnersCount(lc);
    } catch {
      // ignore
    }
  };

  const loadPlacements = async () => {
    if (!user) {
      setPlacements([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data, error: supaError } = (await withTimeout(
        supabase
          .from("placements")
          .select(
            "id, learner_id, host_name, programme, status, start_date, end_date, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(1000),
        12000,
        "Load placements",
      )) as {
        data:
          | {
              id: string;
              learner_id: string;
              host_name: string;
              programme: string;
              status: string;
              start_date: string | null;
              end_date: string | null;
              created_at: string;
            }[]
          | null;
        error: { message: string } | null;
      };

      if (supaError) throw new Error(supaError.message);

      const learnerIds = Array.from(
        new Set((data ?? []).map((row) => row.learner_id).filter(Boolean)),
      );
      const learnerById = new Map<string, string>();
      if (learnerIds.length > 0) {
        const { data: learnerRows, error: learnersError } = (await withTimeout(
          supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", learnerIds),
          12000,
          "Load learners",
        )) as {
          data:
            | { id: string; full_name: string | null; email: string | null }[]
            | null;
          error: { message: string } | null;
        };
        if (learnersError) throw new Error(learnersError.message);
        (learnerRows ?? []).forEach((l) => {
          learnerById.set(l.id, l.full_name ?? l.email ?? l.id);
        });
      }

      const normalized: PlacementRow[] = (data ?? []).map((row) => {
        const statusValue = ((): PlacementStatus => {
          const s = String(row.status ?? "");
          if (s === "Active") return "Active";
          if (s === "Inactive") return "Inactive";
          if (s === "Pending") return "Pending";
          if (s === "Suspended") return "Suspended";
          if (s === "Cancelled") return "Cancelled";
          if (s === "Completed") return "Completed";
          return "Pending";
        })();

        return {
          id: row.id,
          learnerId: row.learner_id,
          learnerName: learnerById.get(row.learner_id) ?? row.learner_id,
          host: row.host_name ?? "",
          programme: row.programme ?? "",
          status: statusValue,
          startDate: row.start_date ?? "",
          endDate: row.end_date ?? "",
          createdAt: row.created_at,
        };
      });

      setPlacements(normalized);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load placements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    void loadPlacements();
    void loadAuditLogs();
    void loadSummaryCounts();
  }, [authLoading, user]);

  const getPeriodStart = (period: string): Date | null => {
    if (period === "week") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d;
    }
    if (period === "month") {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return d;
    }
    if (period === "quarter") {
      const d = new Date();
      d.setMonth(d.getMonth() - 3);
      return d;
    }
    if (period === "year") {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      return d;
    }
    return null;
  };

  const filteredPlacements = useMemo(() => {
    let filtered = placements;

    if (status !== "all") {
      filtered = filtered.filter(
        (item) => item.status.toLowerCase() === status.toLowerCase(),
      );
    }

    const periodStart = getPeriodStart(timePeriod);
    if (periodStart) {
      filtered = filtered.filter(
        (item) => new Date(item.createdAt).getTime() >= periodStart.getTime(),
      );
    }

    return filtered;
  }, [placements, status, timePeriod]);

  const filteredAuditLogs = useMemo(() => {
    let filtered = auditLogs;

    if (actionType !== "all") {
      filtered = filtered.filter(
        (item) => item.action.toLowerCase() === actionType.toLowerCase(),
      );
    }

    if (startDate) {
      filtered = filtered.filter(
        (item) => item.created_at.slice(0, 10) >= startDate,
      );
    }

    if (endDate) {
      filtered = filtered.filter(
        (item) => item.created_at.slice(0, 10) <= endDate,
      );
    }

    return filtered;
  }, [auditLogs, actionType, startDate, endDate]);

  const auditSummary = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const total = filteredAuditLogs.length;
    const todayCount = filteredAuditLogs.filter(
      (row) => row.created_at.slice(0, 10) === today,
    ).length;
    const weekCount = filteredAuditLogs.filter(
      (row) => new Date(row.created_at).getTime() >= weekStart.getTime(),
    ).length;

    return { total, todayCount, weekCount };
  }, [filteredAuditLogs]);

  const getPaginatedAuditData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAuditLogs.slice(startIndex, endIndex);
  };

  const getPaginationInfo = () => {
    const totalPages = Math.ceil(filteredAuditLogs.length / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(
      currentPage * itemsPerPage,
      filteredAuditLogs.length,
    );

    return {
      totalPages,
      startItem,
      endItem,
      totalItems: filteredAuditLogs.length,
    };
  };

  const renderPlacementsReports = () => (
    <div className="reports-content">
      <div className="reports-header">
        <h2>Placements Reports</h2>
        <div className="reports-filters">
          <Dropdown
            label=""
            value={timePeriod}
            onChange={setTimePeriod}
            options={[
              { label: "All Time Periods", value: "all" },
              { label: "This Week", value: "week" },
              { label: "This Month", value: "month" },
              { label: "This Quarter", value: "quarter" },
              { label: "This Year", value: "year" },
            ]}
            placeholder="Select Time Period"
          />
          <Dropdown
            label=""
            value={status}
            onChange={setStatus}
            options={[
              { label: "All Status", value: "all" },
              { label: "Active", value: "active" },
              { label: "Completed", value: "completed" },
              { label: "Pending", value: "pending" },
            ]}
            placeholder="Select Status"
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "16px 0" }}>
          <LoadingSpinner />
        </div>
      ) : null}

      {error ? (
        <div style={{ color: "#dc3545", padding: "12px 0" }}>{error}</div>
      ) : null}

      <div className="reports-grid">
        <DashboardStats
          stats={[
            { label: "Total Placements", value: filteredPlacements.length },
            {
              label: "Active",
              value: filteredPlacements.filter((p) => p.status === "Active")
                .length,
            },
            {
              label: "Completed",
              value: filteredPlacements.filter((p) => p.status === "Completed")
                .length,
            },
            {
              label: "Pending",
              value: filteredPlacements.filter((p) => p.status === "Pending")
                .length,
            },
          ]}
        />
      </div>

      <div className="reports-grid">
        <DashboardStats
          stats={[
            { label: "Total Hosts", value: hostsCount },
            { label: "Active Hosts", value: "N/A" },
            { label: "Pending Hosts", value: "N/A" },
          ]}
        />
      </div>

      <div className="reports-grid">
        <DashboardStats
          stats={[
            { label: "Total Learners", value: learnersCount },
            {
              label: "Completion Rate",
              value:
                filteredPlacements.length > 0
                  ? `${Math.round(
                      (filteredPlacements.filter(
                        (p) => p.status === "Completed",
                      ).length /
                        filteredPlacements.length) *
                        100,
                    )}%`
                  : "N/A",
            },
            {
              label: "Avg Duration (days)",
              value: (() => {
                const durations = filteredPlacements
                  .map((p) => {
                    if (!p.startDate || !p.endDate) return null;
                    const start = new Date(p.startDate);
                    const end = new Date(p.endDate);
                    const diff = end.getTime() - start.getTime();
                    if (Number.isNaN(diff)) return null;
                    return Math.round(diff / (1000 * 60 * 60 * 24));
                  })
                  .filter((d): d is number => d !== null);
                if (durations.length === 0) return "N/A";
                const avg =
                  durations.reduce((sum, d) => sum + d, 0) / durations.length;
                return Math.round(avg);
              })(),
            },
          ]}
        />
      </div>

      <div className="reports-table-section">
        <h3>Recent Placements</h3>
        <TableComponent
          columns={[
            { header: "Learner Name", key: "name" },
            { header: "Host Company", key: "host" },
            {
              header: "Status",
              key: "status",
              render: (item: any) => (
                <span className={`status-badge ${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
              ),
            },
            { header: "Start Date", key: "startDate" },
          ]}
          data={filteredPlacements.slice(0, 50).map((p) => ({
            id: p.id,
            name: p.learnerName,
            host: p.host,
            status: p.status,
            startDate:
              p.startDate || (p.createdAt ? p.createdAt.slice(0, 10) : ""),
          }))}
        />
      </div>
    </div>
  );

  const renderAuditTrails = () => (
    <div className="reports-content">
      <div className="reports-header">
        <h2>Audit Trails</h2>
        <div className="reports-filters">
          <InputField
            label=""
            value={startDate}
            onChange={setStartDate}
            type="date"
            placeholder="Start Date"
          />
          <InputField
            label=""
            value={endDate}
            onChange={setEndDate}
            type="date"
            placeholder="End Date"
          />
          <Dropdown
            label=""
            value={actionType}
            onChange={setActionType}
            options={[
              { label: "All Actions", value: "all" },
              { label: "Insert", value: "INSERT" },
              { label: "Update", value: "UPDATE" },
              { label: "Delete", value: "DELETE" },
            ]}
            placeholder="Select Action"
          />
        </div>
      </div>

      <div className="audit-stats">
        <DashboardStats
          stats={[
            { label: "Total Actions", value: auditSummary.total },
            { label: "Today", value: auditSummary.todayCount },
            { label: "This Week", value: auditSummary.weekCount },
          ]}
        />
      </div>

      <div className="audit-table-section">
        <h3>Recent Activity</h3>
        <TableComponent
          columns={[
            { header: "User", key: "user" },
            {
              header: "Action",
              key: "action",
              render: (item: any) => (
                <span className={`action-badge ${item.action.toLowerCase()}`}>
                  {item.action}
                </span>
              ),
            },
            { header: "Table", key: "module" },
            { header: "Details", key: "details" },
          ]}
          data={getPaginatedAuditData().map((row) => ({
            id: row.id,
            user: formatActorDisplay(row),
            action: row.action,
            module: row.table_name,
            details: formatAuditDetails(row),
          }))}
        />

        {/* Pagination Controls */}
        <div className="pagination-controls">
          <div className="pagination-info">
            Showing {getPaginationInfo().startItem}-
            {getPaginationInfo().endItem} of {getPaginationInfo().totalItems}{" "}
            results
          </div>
          <div className="pagination-buttons">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="pagination-page-info">
              Page {currentPage} of {getPaginationInfo().totalPages}
            </span>
            <button
              className="pagination-btn"
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(getPaginationInfo().totalPages, prev + 1),
                )
              }
              disabled={currentPage === getPaginationInfo().totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="reports-container">
      <div className="reports-content-wrapper">
        <div className="reports-header-main">
          <h1>Super Admin Reports</h1>
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === "placements" ? "active" : ""}`}
              onClick={() => setActiveTab("placements")}
            >
              Placements Reports
            </button>
            <button
              className={`tab-button ${activeTab === "audit" ? "active" : ""}`}
              onClick={() => setActiveTab("audit")}
            >
              Audit Trails
            </button>
          </div>
        </div>

        <div className="tab-content">
          {activeTab === "placements" && renderPlacementsReports()}
          {activeTab === "audit" && renderAuditTrails()}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorReports;
