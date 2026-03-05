import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import TableComponent, { type TableColumn } from "../components/TableComponent";
import Card from "../components/Card";
import Button from "../components/Button";
import Snackbar from "../components/Snackbar";
import Modal from "../components/Modal";
import AddPlacementModal from "../components/AddPlacementModal";
import "./ProgrammeCoordinatorPlacements.css";

interface Placement {
  id: string;
  learner: string;
  learner_id: string;
  host: string;
  host_id: string;
  program: string;
  status: string;
  startDate: string;
  endDate: string;
}

const ProgrammeCoordinatorPlacements: React.FC = () => {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPlacement, setEditPlacement] = useState<Placement | null>(null);
  const [deletePlacement, setDeletePlacement] = useState<Placement | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchPlacements = async () => {
    try {
      setLoading(true);
      
      const { data: lpData, error: lpError } = await supabase
        .from("learner_placements")
        .select("*")
        .order("created_at", { ascending: false });

      if (lpError) throw lpError;

      const { data: profData } = await supabase
        .from("profiles")
        .select("id, full_name, email");
      
      const profileMap = (profData || []).reduce((acc: any, p) => {
        acc[p.id] = p.full_name || p.email;
        return acc;
      }, {});

      const formatted: Placement[] = (lpData || []).map((p: any) => ({
        id: p.id,
        learner_id: p.learner_id,
        host_id: p.host_id || "",
        learner: profileMap[p.learner_id] || "Unknown Learner",
        host: p.host_name || "Unknown Host",
        program: p.program,
        status: p.status,
        startDate: p.start_date || "",
        endDate: p.end_date || "",
      }));

      setPlacements(formatted);
    } catch (err: any) {
      console.error("Error fetching placements:", err);
      setSnackbarMessage(`Error: ${err.message || "Failed to load placements"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacements();
  }, []);

  const handleStatusChange = async (placementId: string, newStatus: string) => {
    if (!newStatus) return;
    try {
      const { error } = await supabase
        .from("learner_placements")
        .update({ status: newStatus })
        .eq("id", placementId);

      if (error) throw error;
      
      setPlacements(prev => prev.map(p => p.id === placementId ? { ...p, status: newStatus } : p));
      setSnackbarMessage(`Status updated to ${newStatus}`);
    } catch (err: any) {
      setSnackbarMessage("Failed to update status.");
    }
  };

  const confirmDelete = async () => {
    if (!deletePlacement) return;
    setProcessing(true);
    try {
      const { error } = await supabase.from("learner_placements").delete().eq("id", deletePlacement.id);
      if (error) throw error;
      setSnackbarMessage("Placement deleted successfully.");
      setDeletePlacement(null);
      fetchPlacements();
    } catch (err: any) {
      setSnackbarMessage(`Delete failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = (p: Placement) => {
    setEditPlacement(p);
    setShowAddModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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
        <select
          style={{ 
            padding: '6px 12px', 
            borderRadius: '4px', 
            border: 'none',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: getStatusColor(row.status),
            color: 'white',
            width: '120px',
            appearance: 'none',
            textAlign: 'center'
          }}
          onChange={(e) => handleStatusChange(row.id, e.target.value)}
          value={row.status || 'Pending'}
        >
          <option value="Pending" style={{ backgroundColor: 'white', color: '#000' }}>PENDING</option>
          <option value="Active" style={{ backgroundColor: 'white', color: '#000' }}>ACTIVE</option>
          <option value="Suspended" style={{ backgroundColor: 'white', color: '#000' }}>SUSPENDED</option>
          <option value="Cancelled" style={{ backgroundColor: 'white', color: '#000' }}>CANCELLED</option>
        </select>
      )
    },
    { key: "startDate", header: "Start Date" },
    { key: "endDate", header: "End Date" },
    {
      key: "actions",
      header: "Actions",
      render: (row: Placement) => (
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span onClick={() => handleEdit(row)} style={{ cursor: 'pointer', color: "var(--primary-color)" }} title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83l3.75 3.75M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z" /></svg>
          </span>
          <span onClick={() => setDeletePlacement(row)} style={{ cursor: 'pointer', color: "var(--secondary-color)" }} title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12l1.41 1.41L13.41 14l2.12 2.12l-1.41 1.41L12 15.41l-2.12 2.12l-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z" /></svg>
          </span>
        </div>
      )
    }
  ];

  return (
    <div className="programme-coordinator-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title">Super Admin - Placements</h1>
        <Button 
          text="Add Placement" 
          onClick={() => { setEditPlacement(null); setShowAddModal(true); }} 
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

      {showAddModal && (
        <AddPlacementModal 
          isOpen={showAddModal} 
          onClose={() => { setShowAddModal(false); setEditPlacement(null); }} 
          editPlacement={editPlacement}
          onSuccess={() => {
            setSnackbarMessage(editPlacement ? "Placement updated successfully!" : "Placement created successfully!");
            fetchPlacements();
          }}
        />
      )}

      {deletePlacement && (
        <Modal isOpen={Boolean(deletePlacement)} onClose={() => setDeletePlacement(null)} title="Confirm Deletion">
          <div style={{ padding: '10px' }}>
            <p>Are you sure you want to delete the placement for <strong>{deletePlacement.learner}</strong> at <strong>{deletePlacement.host}</strong>?</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <Button text="Cancel" onClick={() => setDeletePlacement(null)} variant="secondary" />
              <Button text={processing ? "Deleting..." : "Delete"} onClick={confirmDelete} variant="primary" disabled={processing} />
            </div>
          </div>
        </Modal>
      )}

      <Snackbar 
        message={snackbarMessage} 
        onClose={() => setSnackbarMessage("")} 
      />
    </div>
  );
};

export default ProgrammeCoordinatorPlacements;
