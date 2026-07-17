import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

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

      <div
  style={{
    flex: 1,
    display: "flex",
    flexDirection: "column",
  }}
>
  <Header />

  <main
    style={{
      flex: 1,
      padding: "35px",
      background: "#f8fafc",
    }}
  >
    {children}
  </main>
</div>
    </div>
  );
}