import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import AppRoutes from "./routes/AppRoutes";
import { TicketProvider } from "./context/TicketContext";

import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <TicketProvider>
        <AppRoutes />
      </TicketProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
