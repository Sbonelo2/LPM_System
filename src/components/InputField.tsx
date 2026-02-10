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
        className="input-field__control"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
      />
    </div>
  );
};

export default InputField;
