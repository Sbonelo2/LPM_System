import React, { useState } from "react";
import "./CoordinatorHosts.css";
import Button from "../components/Button";
import SideBar from "../components/SideBar";
import AddHostModal from "../components/AddHostModal";
import Card from "../components/Card";
import type { NewHostPayload } from "../components/AddHostModal";

const CoordinatorHosts: React.FC = () => {
  const [showAddHostModal, setShowAddHostModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHost, setSelectedHost] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [hosts, setHosts] = useState([
    {
      id: "HOST001",
      name: "ABC Company",
      industry: "Technology",
      location: "Johannesburg, Gauteng",
      contactPerson: "John Manager",
      email: "contact@abccompany.co.za",
      phone: "+27 11 234 5678",
      capacity: 10,
      currentLearners: 6,
      status: "Active"
    },
    {
      id: "HOST002", 
      name: "XYZ Organization",
      industry: "Finance",
      location: "Cape Town, Western Cape",
      contactPerson: "Jane Supervisor",
      email: "info@xyzorg.co.za",
      phone: "+27 21 345 6789",
      capacity: 8,
      currentLearners: 4,
      status: "Active"
    },
    {
      id: "HOST003",
      name: "Tech Solutions Ltd",
      industry: "IT Services",
      location: "Durban, KwaZulu-Natal",
      contactPerson: "Mike Director",
      email: "admin@techsolutions.co.za",
      phone: "+27 31 456 7890",
      capacity: 12,
      currentLearners: 9,
      status: "Pending"
    }
  ]);

  // Get unique industries for filter dropdown
  const industries = ["all", ...new Set(hosts.map(host => host.industry))];
  
  // Filter hosts based on filters
  const filteredHosts = hosts.filter(host => {
    const matchesStatus = statusFilter === "all" || host.status === statusFilter;
    const matchesIndustry = industryFilter === "all" || host.industry === industryFilter;
    return matchesStatus && matchesIndustry;
  });

  const handleAddHost = (payload: NewHostPayload) => {
    console.log("Adding host:", payload);
    // Add the new host to the list with correct capacity and industry
    const newHost = {
      id: `HOST${String(hosts.length + 1).padStart(3, '0')}`,
      name: payload.hostName,
      industry: "General", // You can make this a field in the form if needed
      location: payload.location,
      contactPerson: payload.contactPerson,
      email: payload.contactEmail,
      phone: payload.contactPhone,
      capacity: 5, // Default capacity, can be made configurable
      currentLearners: 0,
      status: "Pending"
    };
    setHosts([...hosts, newHost]);
    setShowAddHostModal(false);
  };

  const handleEditHost = (host: any) => {
    setSelectedHost(host);
    setShowEditModal(true);
  };

  const handleUpdateHost = (payload: NewHostPayload) => {
    if (!selectedHost) return;
    
    const updatedHosts = hosts.map(host => 
      host.id === selectedHost.id 
        ? { 
            ...host, 
            name: payload.hostName,
            location: payload.location,
            contactPerson: payload.contactPerson,
            email: payload.contactEmail,
            phone: payload.contactPhone
          }
        : host
    );
    setHosts(updatedHosts);
    setShowEditModal(false);
    setSelectedHost(null);
  };

  const handleDeleteHost = (host: any) => {
    setSelectedHost(host);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!selectedHost) return;
    
    const updatedHosts = hosts.filter(host => host.id !== selectedHost.id);
    setHosts(updatedHosts);
    setShowDeleteModal(false);
    setSelectedHost(null);
  };

  return (
    <div className="hosts-container">
      <SideBar />
      <div className="hosts-content">
        <div className="hosts-header">
          <h2 className="hosts-title">Coordinator Hosts</h2>
        </div>
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
                {industries.map(industry => (
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
                  <p><strong>Contact:</strong> {host.contactPerson}</p>
                  <p><strong>Email:</strong> {host.email}</p>
                  <p><strong>Phone:</strong> {host.phone}</p>
                  <p><strong>Capacity:</strong> {host.currentLearners}/{host.capacity} learners</p>
                  <p><strong>Status:</strong> 
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
        <div className="host-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="host-modal-content" onClick={(e) => e.stopPropagation()}>
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
                    hostName: (document.getElementById('editHostName') as HTMLInputElement)?.value || selectedHost.name,
                    location: (document.getElementById('editLocation') as HTMLInputElement)?.value || selectedHost.location,
                    contactPerson: (document.getElementById('editContactPerson') as HTMLInputElement)?.value || selectedHost.contactPerson,
                    contactEmail: (document.getElementById('editContactEmail') as HTMLInputElement)?.value || selectedHost.email,
                    contactPhone: (document.getElementById('editContactPhone') as HTMLInputElement)?.value || selectedHost.phone,
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
        <div className="host-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="host-modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
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
                  <p><strong>Location:</strong> {selectedHost.location}</p>
                  <p><strong>Contact:</strong> {selectedHost.contactPerson}</p>
                  <p><strong>Email:</strong> {selectedHost.email}</p>
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
