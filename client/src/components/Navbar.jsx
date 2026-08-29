import { Home } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useFamily } from "../context/FamilyContext.jsx";
import ViewToggle from "./ViewToggle.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const sharedNavItems = [
  ["/expenses", "expenses", "Expenses"],
  ["/calendar", "calendar", "Calendar"],
  ["/shopping", "shopping", "Shopping"],
  ["/settings", "settings", "Settings"],
];

const familyNavItems = [
  ["/chat", "chat", "Chat"],
  ["/family", "family", "Family"],
];

export default function Navbar() {
  const { view, setView } = useFamily();
  const { t } = useLanguage();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const navItems = view === "family"
    ? [...sharedNavItems.slice(0, 3), ...familyNavItems, sharedNavItems[3]]
    : sharedNavItems;

  return (
    <header className={`navbar ${isHome ? "navbar-home" : "navbar-inner"}`}>
      <div className="nav-start">
        <NavLink to="/" end className="nav-home-link desktop-home-link" aria-label={t("home", "Home")}>
          <Home size={18} aria-hidden="true" />
          <span>{t("home", "Home")}</span>
        </NavLink>
      </div>

      <div className="navbar-view-toggle">
        <ViewToggle view={view} setView={setView} />
      </div>

      <div className="nav-actions">
        <nav className="nav-links" aria-label="Primary navigation">
          {navItems.map(([to, key, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {t(key, label)}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
