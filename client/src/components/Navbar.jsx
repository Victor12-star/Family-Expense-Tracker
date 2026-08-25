// =====================================================================
// Navbar — top navigation (desktop) with brand, view toggle, avatar
// =====================================================================
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useFamily } from "../context/FamilyContext.jsx";
import ViewToggle from "./ViewToggle.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { view, setView } = useFamily();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="nav-brand">
        <Link to="/" className="nav-logo">👨‍👩‍👧‍👦</Link>
        <span className="nav-name">Family Expense Tracker</span>
      </div>

      <ViewToggle view={view} setView={setView} />

      <div className="nav-actions">
        <nav className="nav-links" aria-label="Primary">
          <NavLink to="/expenses" className={({ isActive }) => (isActive ? "active" : "")}>Expenses</NavLink>
          <NavLink to="/calendar" className={({ isActive }) => (isActive ? "active" : "")}>Calendar</NavLink>
          <NavLink to="/shopping" className={({ isActive }) => (isActive ? "active" : "")}>Shopping</NavLink>
          <NavLink to="/chat" className={({ isActive }) => (isActive ? "active" : "")}>Chat</NavLink>
          <NavLink to="/family" className={({ isActive }) => (isActive ? "active" : "")}>Family</NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? "active" : "")}>Settings</NavLink>
        </nav>
        <span className="avatar" aria-label={user?.name ? `Logged in as ${user.name}` : "Guest"}>
          {user?.name?.[0]?.toUpperCase()}
        </span>
        <button className="btn ghost" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}
