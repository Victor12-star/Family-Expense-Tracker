// =====================================================================
// Navbar — top navigation (desktop) with brand, view toggle, avatar
// =====================================================================
import { Link, useNavigate } from "react-router-dom";
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
          <Link to="/expenses">Expenses</Link>
          <Link to="/calendar">Calendar</Link>
          <Link to="/shopping">Shopping</Link>
          <Link to="/chat">Chat</Link>
          <Link to="/family">Family</Link>
          <Link to="/settings">Settings</Link>
        </nav>
        <span className="avatar" aria-label={user?.name ? `Logged in as ${user.name}` : "Guest"}>
          {user?.name?.[0]?.toUpperCase()}
        </span>
        <button className="btn ghost" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}
