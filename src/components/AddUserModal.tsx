import React from "react";
import "./AddUserModal.css";

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: { name: string; email: string }) => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  open,
  onClose,
  onCreate,
}) => {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add New User</h2>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={() => {
              onCreate({ name, email });
              onClose();
            }}
          > 
            Add User
          </button>
          </div>
      </div>
    </div>
  );
};

export default AddUserModal;