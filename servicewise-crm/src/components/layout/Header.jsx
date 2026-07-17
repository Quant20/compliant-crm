import React from "react";
import { FaBell, FaSearch, FaUserCircle } from "react-icons/fa";

export default function Header() {
  return (
    <header
      style={{
        height: "70px",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 30px",
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            color: "#111827",
          }}
        >
          Dashboard
        </h2>

        <small
          style={{
            color: "#6b7280",
          }}
        >
          Welcome to ServiceWise CRM
        </small>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <FaSearch size={18} />

        <FaBell size={18} />

        <FaUserCircle size={34} />
      </div>
    </header>
  );
}