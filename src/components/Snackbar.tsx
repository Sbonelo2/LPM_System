import React, { useEffect, useState } from 'react';
import './Snackbar.css';

interface SnackbarProps {
  message: string;
  duration?: number; // Duration in milliseconds, default to 3000
  onClose: () => void;
}

const Snackbar: React.FC<SnackbarProps> = ({ message, duration = 3000, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (message) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) {
    return null;
  }

  return (
    <div className={`snackbar-container ${show ? 'show' : ''}`}>
      <span className="snackbar-message">{message}</span>
    </div>
  );
};

export default Snackbar;
