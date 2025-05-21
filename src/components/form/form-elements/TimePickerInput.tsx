import React from 'react';

interface TimePickerInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  name: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const TimePickerInput: React.FC<TimePickerInputProps> = ({
  label,
  value,
  onChange,
  name,
  required = false,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="text-danger">*</span>}
        </label>
      )}
      <input
        type="time"
        className="form-control"
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
      />
    </div>
  );
};

export default TimePickerInput;