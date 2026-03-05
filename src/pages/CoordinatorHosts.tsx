import React, { useEffect, useState } from "react";
import "./CoordinatorHosts.css";
import Button from "../components/Button";
import AddHostModal from "../components/AddHostModal";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import Snackbar from "../components/Snackbar";
import { supabase } from "../services/supabaseClient";
import type { NewHostPayload } from "../components/AddHostModal";
import { useAuth } from "../hooks/useAuth";

type CoordinatorHostsProps = {
  pageTitle?: string;
};

const CoordinatorHosts: React.FC<CoordinatorHostsProps> = ({ pageTitle }) => {
  const { user, loading: authLoading } = useAuth();
  const [showAddHostModal, setShowAddHostModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHost, setSelectedHost] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [hosts, setHosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchHosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("host_organizations")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setHosts(data || []);
    } catch (err: any) {
      console.error("Error fetching hosts:", err);
      setSnackbarMessage("Failed to load hosts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHosts();
  }, []);

  const industries = ["all", ...new Set(hosts.map((host) => host.industry))];

  const filteredHosts = hosts.filter((host) => {
    const matchesStatus =
      statusFilter === "all" || host.status === statusFilter;
    const matchesIndustry =
      industryFilter === "all" || host.industry === industryFilter;
    return matchesStatus && matchesIndustry;
  });

  const handleAddHost = async (payload: NewHostPayload) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("host_organizations")
        .insert([{
          name: payload.hostName,
          industry: "General",
          location: payload.location,
          contact_person: payload.contactPerson,
          email: payload.contactEmail,
          phone: payload.contactPhone,
          current_learners: payload.currentLearners,
          capacity: payload.maxCapacity,
          status: "Active"
        }]);

      if (error) throw error;
      setSnackbarMessage("Host added successfully!");
      fetchHosts();
      setShowAddHostModal(false);
    } catch (err: any) {
      setSnackbarMessage(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleEditHost = (host: any) => {
    setSelectedHost(host);
    setShowEditModal(true);
  };

  const handleUpdateHost = async (payload: any) => {
    if (!selectedHost) return;
    setProcessing(true);
    try {
      // Parse "5/10" string from edit modal
      const parts = payload.capacity.split("/");
      const current = parseInt(parts[0]);
      const max = parseInt(parts[1]);

      if (isNaN(current) || isNaN(max)) {
        throw new Error("Capacity must be in format 'current/max' (e.g. 5/10)");
      }

      const { error } = await supabase
        .from("host_organizations")
        .update({
          name: payload.hostName,
          location: payload.location,
          contact_person: payload.contactPerson,
          email: payload.contactEmail,
          phone: payload.contactPhone,
          current_learners: current,
          capacity: max,
        })
        .eq("id", selectedHost.id);

      if (error) throw error;
      setSnackbarMessage("Host updated successfully!");
      fetchHosts();
      setShowEditModal(false);
    } catch (err: any) {
      setSnackbarMessage(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedHost) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("host_organizations")
        .delete()
        .eq("id", selectedHost.id);

      if (error) throw error;
      setSnackbarMessage("Host deleted.");
      fetchHosts();
      setShowDeleteModal(false);
    } catch (err: any) {
      setSnackbarMessage(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="hosts-container">
      <div className="hosts-content">
        <div className="hosts-header">
          <h2 className="hosts-title">{pageTitle || "Super Admin Hosts"}</h2>
        </div>
        
        <Snackbar message={snackbarMessage} onClose={() => setSnackbarMessage("")} />

        <div className="hosts-main">
          <div className="hosts-controls">
            <div className="hosts-filters">
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
              <select
                className="filter-select"
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
              >
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry === "all" ? "All Industries" : industry}
                  </option>
                ))}
              </select>
            </div>
            <Button
              text="Add Host"
              onClick={() => setShowAddHostModal(true)}
              className="add-host-btn"
            />
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="hosts-grid">
              {filteredHosts.length === 0 ? (
                <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>No hosts found.</p>
              ) : (
                filteredHosts.map((host) => (
                  <Card
                    key={host.id}
                    title={host.name}
                    subtitle={`${host.industry} • ${host.location}`}
                    className="host-card"
                  >
                    <div className="host-details">
                      <p><strong>Contact:</strong> {host.contact_person}</p>
                      <p><strong>Email:</strong> {host.email}</p>
                      <p><strong>Phone:</strong> {host.phone}</p>
                      <p><strong>Capacity:</strong> {host.current_learners || 0}/{host.capacity || 0} learners</p>
                      <p>
                        <strong>Status:</strong>
                        <span className={`status-badge ${host.status.toLowerCase()}`}>
                          {host.status}
                        </span>
                      </p>
                    </div>
                    <div className="host-actions">
                      <Button
                        text="Edit"
                        onClick={() => handleEditHost(host)}
                        className="host-action-btn edit-btn"
                      />
                      <Button
                        text="Delete"
                        onClick={() => { setSelectedHost(host); setShowDeleteModal(true); }}
                        className="host-action-btn delete-btn"
                      />
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <AddHostModal
        open={showAddHostModal}
        onClose={() => setShowAddHostModal(false)}
        onCreate={handleAddHost}
      />

      {showEditModal && selectedHost && (
        <div className="host-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="host-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Host</h2>
              <Button text="×" onClick={() => setShowEditModal(false)} className="modal-close-btn" />
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Host Name</label>
                <input id="editHostName" className="form-input" defaultValue={selectedHost.name} />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input id="editLocation" className="form-input" defaultValue={selectedHost.location} />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person</label>
                <input id="editContactPerson" className="form-input" defaultValue={selectedHost.contact_person} />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input id="editContactEmail" className="form-input" defaultValue={selectedHost.email} />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input id="editContactPhone" className="form-input" defaultValue={selectedHost.phone} />
              </div>
              <div className="form-group">
                <label className="form-label">Learner Capacity (Current/Max)</label>
                <input id="editCapacity" type="text" className="form-input" defaultValue={`${selectedHost.current_learners || 0}/${selectedHost.capacity || 0}`} placeholder="e.g. 5/10" />
              </div>
            </div>
            <div className="modal-footer">
              <Button text="Cancel" onClick={() => setShowEditModal(false)} className="modal-btn modal-btn-cancel" />
              <Button
                text={processing ? "Updating..." : "Update Host"}
                onClick={() => {
                  const payload = {
                    hostName: (document.getElementById("editHostName") as HTMLInputElement)?.value,
                    location: (document.getElementById("editLocation") as HTMLInputElement)?.value,
                    contactPerson: (document.getElementById("editContactPerson") as HTMLInputElement)?.value,
                    contactEmail: (document.getElementById("editContactEmail") as HTMLInputElement)?.value,
                    contactPhone: (document.getElementById("editContactPhone") as HTMLInputElement)?.value,
                    capacity: (document.getElementById("editCapacity") as HTMLInputElement)?.value,
                  };
                  handleUpdateHost(payload);
                }}
                className="modal-btn modal-btn-submit"
                disabled={processing}
              />
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedHost && (
        <div className="host-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="host-modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Host</h2>
              <Button text="×" onClick={() => setShowDeleteModal(false)} className="modal-close-btn" />
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{selectedHost.name}</strong>?</p>
            </div>
            <div className="modal-footer">
              <Button text="Cancel" onClick={() => setShowDeleteModal(false)} className="modal-btn modal-btn-cancel" />
              <Button text={processing ? "Deleting..." : "Delete"} onClick={confirmDelete} className="modal-btn modal-btn-delete" disabled={processing} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorHosts;
