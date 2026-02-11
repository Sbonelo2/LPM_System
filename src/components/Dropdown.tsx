import { useId } from "react";
import "./Dropdown.css";

export type DropdownOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  autoComplete?: string;
};

export default function Dropdown({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
  name,
  autoComplete,
}: Props) {
  const id = useId();

  return (
    <div className="dropdown-field">
      <label className="dropdown-field__label" htmlFor={id}>
        {label}
      </label>
      <div className="dropdown-field__wrapper">
        <select
          id={id}
          name={name}
          className="dropdown-field__control"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
        >
          {placeholder !== undefined && (
            <option value="" disabled={required} hidden={required}>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="dropdown-field__chevron" aria-hidden="true" />
      </div>
    </div>
  );
}
