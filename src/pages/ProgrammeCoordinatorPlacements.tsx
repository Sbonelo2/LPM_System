import React, { useEffect, useState } from "react";
import "./ProgrammeCoordinatorPlacements.css";
import LoadingSpinner from "../components/LoadingSpinner";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../hooks/useAuth";

interface Placement {
  id: string;
  learner: string;
  host: string;
  program: string;
  status: "Active" | "Inactive" | "Pending" | "Suspended" | "Cancelled";
  startDate: string;
  endDate: string;
}

const ProgrammeCoordinatorPlacements: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

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
            "id, host_name, programme, status, start_date, end_date, created_at, learner_id",
          )
          .order("created_at", { ascending: false })
          .limit(200),
        12000,
        "Load placements",
      )) as {
        data:
          | {
              id: string;
              host_name: string;
              programme: string;
              status: string;
              start_date: string | null;
              end_date: string | null;
              created_at: string;
              learner_id: string;
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

      const normalized: Placement[] = (data ?? []).map((row) => {
        const learnerName =
          learnerById.get(row.learner_id) ?? row.learner_id ?? "";

        const status = ((): Placement["status"] => {
          const s = String(row.status ?? "");
          if (s === "Active") return "Active";
          if (s === "Inactive") return "Inactive";
          if (s === "Pending") return "Pending";
          if (s === "Suspended") return "Suspended";
          if (s === "Cancelled") return "Cancelled";
          return "Pending";
        })();

        return {
          id: row.id,
          learner: learnerName,
          host: row.host_name ?? "",
          program: row.programme ?? "",
          status,
          startDate: row.start_date ?? "",
          endDate: row.end_date ?? "",
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
  }, [authLoading, user]);

  const handleAction = async (placementId: string, action: string) => {
    if (!action) return;
    const nextStatus =
      action === "pending"
        ? "Pending"
        : action === "suspended"
          ? "Suspended"
          : action === "cancelled"
            ? "Cancelled"
            : action === "inactive"
              ? "Inactive"
              : "Active";

    try {
      const { error: updateError } = (await withTimeout(
        supabase
          .from("placements")
          .update({ status: nextStatus })
          .eq("id", placementId),
        12000,
        "Update placement status",
      )) as { error: { message: string } | null };

      if (updateError) throw new Error(updateError.message);

      setPlacements((prev) =>
        prev.map((p) =>
          p.id === placementId
            ? { ...p, status: nextStatus as Placement["status"] }
            : p,
        ),
      );
    } catch (e: unknown) {
      alert(
        `Update failed: ${e instanceof Error ? e.message : "Unknown error"}`,
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "#16A34A";
      case "Inactive":
        return "#6B7280";
      case "Pending":
        return "#F59E0B";
      case "Suspended":
        return "#EF4444";
      case "Cancelled":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  return (
    <div className="programme-coordinator-page">
      <div className="page-header">
        <h1 className="page-title">Super Admin - Placements</h1>
        <div className="design-badge">Super Admin - Design</div>
      </div>

      {loading ? (
        <div style={{ padding: "16px 0" }}>
          <LoadingSpinner />
        </div>
      ) : null}

      {error ? (
        <div style={{ color: "#dc3545", padding: "12px 0" }}>{error}</div>
      ) : null}

      <div className="placements-table-container">
        <table className="placements-table">
          <thead>
            <tr>
              <th>Learner</th>
              <th>Host</th>
              <th>Program</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && placements.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ padding: "16px", textAlign: "center" }}
                >
                  No placements found.
                </td>
              </tr>
            ) : null}
            {placements.map((placement) => (
              <tr key={placement.id}>
                <td>{placement.learner}</td>
                <td>{placement.host}</td>
                <td>{placement.program}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: getStatusColor(placement.status),
                    }}
                  >
                    {placement.status}
                  </span>
                </td>
                <td>{placement.startDate}</td>
                <td>{placement.endDate}</td>
                <td>
                  <select
                    className="action-select"
                    onChange={(e) => handleAction(placement.id, e.target.value)}
                    defaultValue=""
                  >
                    <option value="">Select Action</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="inactive">Inactive</option>
                    <option value="active">Active</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProgrammeCoordinatorPlacements;
