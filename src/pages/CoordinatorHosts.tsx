import React, { useEffect, useState } from "react";
import "./CoordinatorHosts.css";
import Button from "../components/Button";
import AddHostModal from "../components/AddHostModal";
import Card from "../components/Card";
import type { NewHostPayload } from "../components/AddHostModal";
import LoadingSpinner from "../components/LoadingSpinner";
import { supabase } from "../services/supabaseClient";
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

  const loadHosts = async () => {
    if (!user) {
      setHosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data, error: supaError } = (await withTimeout(
        supabase
          .from("hosts")
          .select(
            "id, name, industry, location, contact_person, contact_email, contact_phone, capacity, status, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(500),
        12000,
        "Load hosts",
      )) as {
        data:
          | {
              id: string;
              name: string;
              industry: string | null;
              location: string | null;
              contact_person: string | null;
              contact_email: string | null;
              contact_phone: string | null;
              capacity: number | null;
              status: string | null;
              created_at: string;
            }[]
          | null;
        error: { message: string } | null;
      };

      if (supaError) throw new Error(supaError.message);

      setHosts(
        (data ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          industry: row.industry ?? "General",
          location: row.location ?? "",
          contactPerson: row.contact_person ?? "",
          email: row.contact_email ?? "",
          phone: row.contact_phone ?? "",
          capacity: row.capacity ?? 0,
          currentLearners: 0,
          status: row.status ?? "Pending",
        })),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load hosts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    void loadHosts();
  }, [authLoading, user]);

  // Get unique industries for filter dropdown
  const industries = ["all", ...new Set(hosts.map((host) => host.industry))];

  // Filter hosts based on filters
  const filteredHosts = hosts.filter((host) => {
    const matchesStatus =
      statusFilter === "all" || host.status === statusFilter;
    const matchesIndustry =
      industryFilter === "all" || host.industry === industryFilter;
    return matchesStatus && matchesIndustry;
  });

  const handleAddHost = (payload: NewHostPayload) => {
    const insert = async () => {
      try {
        const { error: insertError } = (await withTimeout(
          supabase.from("hosts").insert([
            {
              name: payload.hostName,
              industry: "General",
              location: payload.location,
              contact_person: payload.contactPerson,
              contact_email: payload.contactEmail,
              contact_phone: payload.contactPhone,
              capacity: 5,
              status: "Pending",
            },
          ]),
          12000,
          "Add host",
        )) as { error: { message: string } | null };

        if (insertError) throw new Error(insertError.message);

        setShowAddHostModal(false);
        await loadHosts();
      } catch (e: unknown) {
        alert(
          `Add host failed: ${e instanceof Error ? e.message : "Unknown error"}`,
        );
      }
    };

    void insert();
  };

  const handleEditHost = (host: any) => {
    setSelectedHost(host);
    setShowEditModal(true);
  };

  const handleUpdateHost = (payload: NewHostPayload) => {
    if (!selectedHost) return;

    const update = async () => {
      try {
        const { error: updateError } = (await withTimeout(
          supabase
            .from("hosts")
            .update({
              name: payload.hostName,
              location: payload.location,
              contact_person: payload.contactPerson,
              contact_email: payload.contactEmail,
              contact_phone: payload.contactPhone,
            })
            .eq("id", selectedHost.id),
          12000,
          "Update host",
        )) as { error: { message: string } | null };

        if (updateError) throw new Error(updateError.message);

        setShowEditModal(false);
        setSelectedHost(null);
        await loadHosts();
      } catch (e: unknown) {
        alert(
          `Update failed: ${e instanceof Error ? e.message : "Unknown error"}`,
        );
      }
    };

    void update();
  };

  const handleDeleteHost = (host: any) => {
    setSelectedHost(host);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!selectedHost) return;

    const del = async () => {
      try {
        const { error: deleteError } = (await withTimeout(
          supabase.from("hosts").delete().eq("id", selectedHost.id),
          12000,
          "Delete host",
        )) as { error: { message: string } | null };

        if (deleteError) throw new Error(deleteError.message);

        setShowDeleteModal(false);
        setSelectedHost(null);
        await loadHosts();
      } catch (e: unknown) {
        alert(
          `Delete failed: ${e instanceof Error ? e.message : "Unknown error"}`,
        );
      }
    };

    void del();
  };

  return (
    <div className="hosts-container">
      <div className="hosts-content">
        <div className="hosts-header">
          <h2 className="hosts-title">{pageTitle ?? "Super Admin Hosts"}</h2>
        </div>

        {loading ? (
          <div style={{ padding: "16px 0" }}>
            <LoadingSpinner />
          </div>
        ) : null}

        {error ? (
          <div style={{ color: "#dc3545", padding: "12px 0" }}>{error}</div>
        ) : null}
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

          <div className="hosts-grid">
            {filteredHosts.map((host) => (
              <Card
                key={host.id}
                title={host.name}
                subtitle={`${host.industry} • ${host.location}`}
                className="host-card"
              >
                <div className="host-details">
                  <p>
                    <strong>Contact:</strong> {host.contactPerson}
                  </p>
                  <p>
                    <strong>Email:</strong> {host.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {host.phone}
                  </p>
                  <p>
                    <strong>Capacity:</strong> {host.currentLearners}/
                    {host.capacity} learners
                  </p>
                  <p>
                    <strong>Status:</strong>
                    <span
                      className={`status-badge ${host.status.toLowerCase()}`}
                    >
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
                    onClick={() => handleDeleteHost(host)}
                    className="host-action-btn delete-btn"
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <AddHostModal
        open={showAddHostModal}
        onClose={() => setShowAddHostModal(false)}
        onCreate={handleAddHost}
      />

      {/* Edit Host Modal */}
      {showEditModal && selectedHost && (
        <div
          className="host-modal-overlay"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="host-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Edit Host</h2>
              <Button
                text="×"
                onClick={() => setShowEditModal(false)}
                className="modal-close-btn"
              />
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label" htmlFor="editHostName">
                  Host Name <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <input
                  id="editHostName"
                  className="form-input"
                  placeholder="Enter host company name"
                  defaultValue={selectedHost.name}
                  ref={(input) => {
                    if (input && selectedHost) {
                      input.value = selectedHost.name;
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="editLocation">
                  Location <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <input
                  id="editLocation"
                  className="form-input"
                  placeholder="Enter host location"
                  defaultValue={selectedHost.location}
                  ref={(input) => {
                    if (input && selectedHost) {
                      input.value = selectedHost.location;
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="editContactPerson">
                  Contact Person <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <input
                  id="editContactPerson"
                  className="form-input"
                  placeholder="Enter contact person name"
                  defaultValue={selectedHost.contactPerson}
                  ref={(input) => {
                    if (input && selectedHost) {
                      input.value = selectedHost.contactPerson;
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="editContactEmail">
                  Contact Email <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <input
                  id="editContactEmail"
                  className="form-input"
                  type="email"
                  placeholder="Enter contact email"
                  defaultValue={selectedHost.email}
                  ref={(input) => {
                    if (input && selectedHost) {
                      input.value = selectedHost.email;
                    }
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="editContactPhone">
                  Contact Phone <span style={{ color: "#dc3545" }}>*</span>
                </label>
                <input
                  id="editContactPhone"
                  className="form-input"
                  placeholder="Enter contact phone number"
                  defaultValue={selectedHost.phone}
                  ref={(input) => {
                    if (input && selectedHost) {
                      input.value = selectedHost.phone;
                    }
                  }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <Button
                text="Cancel"
                onClick={() => setShowEditModal(false)}
                className="modal-btn modal-btn-cancel"
              />
              <Button
                text="Update Host"
                onClick={() => {
                  const payload = {
                    hostName:
                      (
                        document.getElementById(
                          "editHostName",
                        ) as HTMLInputElement
                      )?.value || selectedHost.name,
                    location:
                      (
                        document.getElementById(
                          "editLocation",
                        ) as HTMLInputElement
                      )?.value || selectedHost.location,
                    contactPerson:
                      (
                        document.getElementById(
                          "editContactPerson",
                        ) as HTMLInputElement
                      )?.value || selectedHost.contactPerson,
                    contactEmail:
                      (
                        document.getElementById(
                          "editContactEmail",
                        ) as HTMLInputElement
                      )?.value || selectedHost.email,
                    contactPhone:
                      (
                        document.getElementById(
                          "editContactPhone",
                        ) as HTMLInputElement
                      )?.value || selectedHost.phone,
                  };
                  handleUpdateHost(payload);
                }}
                className="modal-btn modal-btn-submit"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedHost && (
        <div
          className="host-modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="host-modal-content delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Delete Host</h2>
              <Button
                text="×"
                onClick={() => setShowDeleteModal(false)}
                className="modal-close-btn"
              />
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <p>Are you sure you want to delete this host?</p>
                <div className="delete-host-info">
                  <h3>{selectedHost.name}</h3>
                  <p>
                    <strong>Location:</strong> {selectedHost.location}
                  </p>
                  <p>
                    <strong>Contact:</strong> {selectedHost.contactPerson}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedHost.email}
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button
                text="Cancel"
                onClick={() => setShowDeleteModal(false)}
                className="modal-btn modal-btn-cancel"
              />
              <Button
                text="Delete Host"
                onClick={confirmDelete}
                className="modal-btn modal-btn-delete"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorHosts;
