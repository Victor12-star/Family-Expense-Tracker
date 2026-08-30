// =====================================================================
// App — route definitions
// =====================================================================
import { useEffect } from "react";
import { Navigate, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Expenses from "./pages/Expenses.jsx";
import Calendar from "./pages/Calendar.jsx";
import Shopping from "./pages/Shopping.jsx";
import Chat from "./pages/Chat.jsx";
import Settings from "./pages/Settings.jsx";
import Family from "./pages/Family.jsx";
import Join from "./pages/Join.jsx";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AccountDeletion, PrivacyPolicy, TermsOfUse } from "./pages/Legal.jsx";
import { useFamily } from "./context/FamilyContext.jsx";

function FamilyOnlyRoute({ children }) {
  const { view } = useFamily();
  return view === "family" ? children : <Navigate to="/" replace />;
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    let listener;
    let active = true;
    CapacitorApp.addListener("backButton", () => {
      if (location.pathname === "/" || location.pathname === "/login") {
        CapacitorApp.minimizeApp();
      } else {
        navigate(-1);
      }
    }).then((handle) => {
      if (active) listener = handle;
      else handle.remove();
    });
    return () => { active = false; listener?.remove(); };
  }, [location.pathname, navigate]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/join/:code" element={<Join />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfUse />} />
      <Route path="/account-deletion" element={<AccountDeletion />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/shopping" element={<Shopping />} />
        <Route path="/chat" element={<FamilyOnlyRoute><Chat /></FamilyOnlyRoute>} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/family" element={<FamilyOnlyRoute><Family /></FamilyOnlyRoute>} />
      </Route>
    </Routes>
  );
}
