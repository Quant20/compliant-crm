import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import AppRoutes from "./routes/AppRoutes";
import { TicketProvider } from "./context/TicketContext";

import "./styles/global.css";
import "./styles/layout.css";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TicketProvider>
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
</TicketProvider>
  </React.StrictMode>
);