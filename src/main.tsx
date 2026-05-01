import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Support from "./Support";
import "./index.css";

const path = window.location.pathname;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {path === "/support" ? <Support /> : <App />}
  </React.StrictMode>
);
