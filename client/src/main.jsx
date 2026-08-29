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
import { LanguageProvider } from "./context/LanguageContext.jsx";
import SkipLink from "./components/SkipLink.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { initAccessibility } from "./utils/accessibility.js";
import "./index.css";

// Apply saved accessibility settings (larger text, contrast, motion) on load
initAccessibility();

// Apply the saved colour theme before React renders to reduce visual flashing.
const savedTheme = localStorage.getItem("fet_theme") || "system";
const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches;
const useLightTheme = savedTheme === "light" || (savedTheme === "system" && prefersLight);
document.documentElement.classList.toggle("light", useLightTheme);
document.documentElement.classList.toggle("dark", !useLightTheme);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <SkipLink />
        <LanguageProvider>
          <AuthProvider>
            <FamilyProvider>
              <CurrencyProvider>
                <App />
              </CurrencyProvider>
            </FamilyProvider>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
