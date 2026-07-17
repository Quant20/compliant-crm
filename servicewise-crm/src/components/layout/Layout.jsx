import React from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f8fafc"
      }}
    >
      {/* Sidebar */}

      <Sidebar />

      {/* Main */}

      <main
        style={{
          flex: 1,
          padding: "40px"
        }}
      >
        {children}
      </main>
    </div>
  );
}