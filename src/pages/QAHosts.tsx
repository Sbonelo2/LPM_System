import React, { useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Modal from "../components/Modal";
import "./QAHosts.css";

type HostStatus = "Active" | "Pending Review" | "Inactive";

type QAHost = {
  id: string;
  name: string;
  location: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: HostStatus;
  activePlacements: number;
  addedOn: string;
  addedBy: string;
  lastAuditDate: string;
  complianceScore: string;
  notes: string;
};

const HOSTS: QAHost[] = [
  {
    id: "HOST-001",
    name: "ABC Company",
    location: "Pietermaritzburg, KZN",
    contactPerson: "John Khumalo",
    email: "john.khumalo@abccompany.co.za",
    phone: "+27 33 123 4567",
    status: "Active",
    activePlacements: 12,
    addedOn: "2025-09-10",
    addedBy: "Programme Coordinator",
    lastAuditDate: "2026-01-14",
    complianceScore: "91%",
    notes: "All onboarding documents are complete. Next review due in March.",
  },
  {
    id: "HOST-002",
    name: "Zulu Logistics",
    location: "Howick, KZN",
    contactPerson: "Nomvula Mthethwa",
    email: "nomvula@zululogistics.co.za",
    phone: "+27 33 765 1144",
    status: "Pending Review",
    activePlacements: 4,
    addedOn: "2025-12-03",
    addedBy: "Admin",
    lastAuditDate: "2026-02-05",
    complianceScore: "78%",
    notes: "Awaiting signed renewal for workplace safety checklist.",
  },
  {
    id: "HOST-003",
    name: "Midlands Tech Hub",
    location: "Hilton, KZN",
    contactPerson: "Sarah Dlamini",
    email: "sarah.dlamini@mthub.co.za",
    phone: "+27 33 991 2210",
    status: "Inactive",
    activePlacements: 0,
    addedOn: "2024-11-18",
    addedBy: "Programme Coordinator",
    lastAuditDate: "2025-10-22",
    complianceScore: "66%",
    notes: "Host paused learner intake until internal restructuring is complete.",
  },
];

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function QAHosts(): React.JSX.Element {
  const [selectedHost, setSelectedHost] = useState<QAHost | null>(null);

  return (
    <div className="qa-hosts-page">
      <div className="qa-hosts-header">
        <h1 className="qa-hosts-title">QA Hosts</h1>
        <p className="qa-hosts-subtitle">
          Review host profiles and inspect full details before audits.
        </p>
      </div>

      <div className="qa-hosts-grid">
        {HOSTS.map((host) => (
          <Card key={host.id} className="qa-host-card">
            <h3 className="qa-host-card__name">{host.name}</h3>
            <div className="qa-host-card__details">
              <p>
                <span>Location:</span> {host.location}
              </p>
              <p>
                <span>Contact Person:</span> {host.contactPerson}
              </p>
              <p>
                <span>Email:</span> {host.email}
              </p>
              <p>
                <span>Phone:</span> {host.phone}
              </p>
              <p>
                <span>Status:</span>{" "}
                <strong className={`qa-host-status qa-host-status--${host.status.toLowerCase().replace(" ", "-")}`}>
                  {host.status}
                </strong>
              </p>
              <p>
                <span>Active Placements:</span> {host.activePlacements}
              </p>
            </div>
            <div className="qa-host-card__actions">
              <Button text="View" variant="secondary" onClick={() => setSelectedHost(host)} />
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={Boolean(selectedHost)}
        onClose={() => setSelectedHost(null)}
        title={selectedHost ? selectedHost.name : "Host Details"}
      >
        {selectedHost && (
          <div className="qa-host-modal">
            <div className="qa-host-modal__row">
              <span>Host ID</span>
              <strong>{selectedHost.id}</strong>
            </div>
            <div className="qa-host-modal__row">
              <span>Location</span>
              <strong>{selectedHost.location}</strong>
            </div>
            <div className="qa-host-modal__row">
              <span>Contact Person</span>
              <strong>{selectedHost.contactPerson}</strong>
            </div>
            <div className="qa-host-modal__row">
              <span>Email</span>
              <strong>{selectedHost.email}</strong>
            </div>
            <div className="qa-host-modal__row">
              <span>Phone</span>
              <strong>{selectedHost.phone}</strong>
            </div>
            <div className="qa-host-modal__row">
              <span>Status</span>
              <strong>{selectedHost.status}</strong>
            </div>
            <div className="qa-host-modal__row">
              <span>Active Placements</span>
              <strong>{selectedHost.activePlacements}</strong>
            </div>
            <div className="qa-host-modal__row">
              <span>Added On</span>
              <strong>{formatDate(selectedHost.addedOn)}</strong>
            </div>
            <div className="qa-host-modal__row">
              <span>Added By</span>
              <strong>{selectedHost.addedBy}</strong>
            </div>
            <div className="qa-host-modal__row">
              <span>Last Audit</span>
              <strong>{formatDate(selectedHost.lastAuditDate)}</strong>
            </div>
            <div className="qa-host-modal__row">
              <span>Compliance Score</span>
              <strong>{selectedHost.complianceScore}</strong>
            </div>
            <div className="qa-host-modal__notes">
              <span>Notes</span>
              <p>{selectedHost.notes}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
