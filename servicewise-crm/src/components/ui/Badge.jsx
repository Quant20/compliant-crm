import React from "react";

export default function Badge({ children, color = "primary" }) {
  return <span className={`badge badge-${color}`}>{children}</span>;
}