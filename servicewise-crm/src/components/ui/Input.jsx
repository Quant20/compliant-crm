import React from "react";

export default function Input({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}) {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}