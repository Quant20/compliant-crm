import "./services/legacyDataCleanup";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { TicketProvider } from "./context/TicketContext";

import "./styles/global.css";
import "./styles/authShell.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TicketProvider>
          <AppRoutes />
        </TicketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
