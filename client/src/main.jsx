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
