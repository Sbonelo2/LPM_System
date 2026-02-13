import React, { useId } from 'react';
import './InputField.css';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  autoComplete?: string;
  error?: string; // Added error prop
};

const InputField: React.FC<Props> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  disabled,
  name,
  autoComplete,
  error, // Destructure error prop
}) => {
  const id = useId();

  return (
    <div className="input-field">
      <label className="input-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        className={`input-field__control ${error ? 'input-field__control--error' : ''}`} // Add error class
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
      />
      {error && <p className="input-field__error-message">{error}</p>} {/* Display error message */}
    </div>
  );
};

export default InputField;
