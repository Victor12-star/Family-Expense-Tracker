// =====================================================================
// React entry point
// =====================================================================
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { FamilyProvider } from "./context/FamilyContext.jsx";
import { CurrencyProvider } from "./context/CurrencyContext.jsx";
import SkipLink from "./components/SkipLink.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { initAccessibility } from "./utils/accessibility.js";
import "./index.css";

// Apply saved accessibility settings (larger text, contrast, motion) on load
initAccessibility();

// Apply the saved colour theme before React renders to reduce visual flashing.
const savedTheme = localStorage.getItem("fet_theme") || "system";
const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches;
document.documentElement.classList.toggle("light", savedTheme === "light" || (savedTheme === "system" && prefersLight));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <SkipLink />
        <AuthProvider>
          <FamilyProvider>
            <CurrencyProvider>
              <App />
            </CurrencyProvider>
          </FamilyProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
