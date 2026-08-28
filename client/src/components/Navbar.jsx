import { LogOut } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useFamily } from "../context/FamilyContext.jsx";
import ViewToggle from "./ViewToggle.jsx";

const navItems = [
  ["/expenses", "Expenses"],
  ["/calendar", "Calendar"],
  ["/shopping", "Shopping"],
  ["/chat", "Chat"],
  ["/family", "Family"],
  ["/settings", "Settings"],
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { view, setView } = useFamily();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className={`navbar ${isHome ? "navbar-home" : "navbar-inner"}`}>
      <div className="nav-start">
        <Link to="/" className="nav-brand" aria-label="Family Expense Tracker home">
          <img src="/brand-mark.png" alt="" className="nav-logo-img" />
          <span className="nav-name">Family Expense Tracker</span>
        </Link>
      </div>

      {isHome && <ViewToggle view={view} setView={setView} />}

      <div className="nav-actions">
        <nav className="nav-links" aria-label="Primary navigation">
          {navItems.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <span className="avatar" aria-label={user?.name ? `Logged in as ${user.name}` : "User"}>
          {user?.name?.[0]?.toUpperCase() || "U"}
        </span>
        {isHome && (
          <button className="btn ghost nav-logout" onClick={handleLogout} type="button">
            <LogOut size={16} aria-hidden="true" />
            <span>Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}
