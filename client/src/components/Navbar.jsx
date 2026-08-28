import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useFamily } from "../context/FamilyContext.jsx";
import ViewToggle from "./ViewToggle.jsx";

const sharedNavItems = [
  ["/expenses", "Expenses"],
  ["/calendar", "Calendar"],
  ["/shopping", "Shopping"],
  ["/settings", "Settings"],
];

const familyNavItems = [
  ["/chat", "Chat"],
  ["/family", "Family"],
];

export default function Navbar() {
  const { user } = useAuth();
  const { family, view, setView } = useFamily();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const availableFamilyItems = family ? familyNavItems : familyNavItems.filter(([to]) => to === "/family");
  const navItems = view === "family"
    ? [...sharedNavItems.slice(0, 3), ...availableFamilyItems, sharedNavItems[3]]
    : sharedNavItems;

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
      </div>
    </header>
  );
}
