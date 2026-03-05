import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import TableComponent, { type TableColumn } from "../components/TableComponent";
import Card from "../components/Card";
import Button from "../components/Button";
import Snackbar from "../components/Snackbar";
import AddPlacementModal from "../components/AddPlacementModal";
import "./ProgrammeCoordinatorPlacements.css";

interface Placement {
  id: string;
  learner: string;
  host: string;
  program: string;
  status: string;
  startDate: string;
  endDate: string;
}

const ProgrammeCoordinatorPlacements: React.FC = () => {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const fetchPlacements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("learner_placements")
        .select(`
          id,
          program,
          status,
          start_date,
          end_date,
          host_name,
          profiles:learner_id (full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted: Placement[] = (data || []).map((p: any) => ({
        id: p.id,
        learner: p.profiles?.full_name || p.profiles?.email || "Unknown",
        host: p.host_name || "Unknown Host",
        program: p.program,
        status: p.status,
        startDate: p.start_date || "N/A",
        endDate: p.end_date || "N/A",
      }));

      setPlacements(formatted);
    } catch (err: any) {
      console.error("Error fetching placements:", err);
      setSnackbarMessage("Failed to load placements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacements();
  }, []);

  const handleAction = async (placementId: string, newStatus: string) => {
    if (!newStatus) return;
    try {
      const { error } = await supabase
        .from("learner_placements")
        .update({ status: newStatus })
        .eq("id", placementId);

      if (error) throw error;
      setSnackbarMessage(`Placement status updated to ${newStatus}`);
      fetchPlacements();
    } catch (err: any) {
      setSnackbarMessage("Failed to update status.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "#16A34A";
      case "pending": return "#F59E0B";
      case "suspended": return "#EF4444";
      case "cancelled": return "#DC2626";
      default: return "#6B7280";
    }
  };

  const columns: TableColumn<Placement>[] = [
    { key: "learner", header: "Learner" },
    { key: "host", header: "Host" },
    { key: "program", header: "Program" },
    { 
      key: "status", 
      header: "Status",
      render: (row: Placement) => (
        <span
          className="status-badge"
          style={{ 
            backgroundColor: getStatusColor(row.status),
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.85rem',
            fontWeight: 500
          }}
        >
          {row.status}
        </span>
      )
    },
    { key: "startDate", header: "Start Date" },
    { key: "endDate", header: "End Date" },
    {
      key: "actions",
      header: "Actions",
      render: (row: Placement) => (
        <select
          className="action-select"
          style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
          onChange={(e) => handleAction(row.id, e.target.value)}
          value={row.status}
        >
          <option value="Pending">Pending</option>
          <option value="Active">Active</option>
          <option value="Suspended">Suspended</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      )
    }
  ];

  return (
    <div className="programme-coordinator-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title">Super Admin - Placements</h1>
        <Button 
          text="Add Placement" 
          onClick={() => setShowAddModal(true)} 
          variant="primary" 
        />
      </div>

      <Card>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>Loading placements...</p>
        ) : (
          <TableComponent
            columns={columns}
            data={placements}
            caption="Manage learner placements and host allocations"
          />
        )}
      </Card>

      <AddPlacementModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSuccess={() => {
          setSnackbarMessage("Placement created successfully!");
          fetchPlacements();
        }}
      />

      <Snackbar 
        message={snackbarMessage} 
        onClose={() => setSnackbarMessage("")} 
      />
    </div>
  );
};

export default ProgrammeCoordinatorPlacements;
