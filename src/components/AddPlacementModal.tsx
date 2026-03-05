import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import InputField from "./InputField";
import Dropdown from "./Dropdown";
import { supabase } from "../services/supabaseClient";

interface AddPlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Option {
  label: string;
  value: string;
}

const AddPlacementModal: React.FC<AddPlacementModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [learners, setLearners] = useState<Option[]>([]);
  const [hosts, setHosts] = useState<Option[]>([]);
  
  const [selectedLearner, setSelectedLearner] = useState("");
  const [selectedHost, setSelectedHost] = useState("");
  const [program, setProgram] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("Active");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
    try {
      // Fetch Learners
      const { data: learnerData, error: learnerErr } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "learner");
      
      if (learnerErr) throw learnerErr;
      setLearners((learnerData || []).map(l => ({ 
        label: `${l.full_name || 'Unnamed'} (${l.email})`, 
        value: l.id 
      })));

      // Fetch Hosts
      const { data: hostData, error: hostErr } = await supabase
        .from("host_organizations")
        .select("id, name");
      
      if (hostErr) throw hostErr;
      setHosts((hostData || []).map(h => ({ label: h.name, value: h.id })));
    } catch (err: any) {
      console.error("Error fetching modal data:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLearner || !selectedHost || !program) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const selectedHostName = hosts.find(h => h.value === selectedHost)?.label || "";
      
      const { error: insertErr } = await supabase
        .from("learner_placements")
        .insert([{
          learner_id: selectedLearner,
          host_name: selectedHostName,
          host_id: selectedHost,
          program: program,
          start_date: startDate || null,
          end_date: endDate || null,
          status: status
        }]);

      if (insertErr) throw insertErr;

      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedLearner("");
    setSelectedHost("");
    setProgram("");
    setStartDate("");
    setEndDate("");
    setStatus("Active");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Placement">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px' }}>
        <Dropdown
          label="Learner"
          value={selectedLearner}
          onChange={setSelectedLearner}
          options={learners}
          placeholder="Select a learner"
          required
        />

        <Dropdown
          label="Host Organization"
          value={selectedHost}
          onChange={setSelectedHost}
          options={hosts}
          placeholder="Select a host"
          required
        />

        <InputField
          label="Program / Course"
          value={program}
          onChange={setProgram}
          placeholder="e.g. Software Development"
          required
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Start Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="form-label">End Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>
        </div>

        <Dropdown
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { label: "Active", value: "Active" },
            { label: "Pending", value: "Pending" },
            { label: "Suspended", value: "Suspended" },
            { label: "Cancelled", value: "Cancelled" }
          ]}
        />

        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <Button text="Cancel" onClick={onClose} variant="secondary" type="button" />
          <Button text={loading ? "Saving..." : "Add Placement"} variant="primary" type="submit" disabled={loading} />
        </div>
      </form>
    </Modal>
  );
};

export default AddPlacementModal;
