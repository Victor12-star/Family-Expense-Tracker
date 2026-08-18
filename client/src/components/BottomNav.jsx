// =====================================================================
// BottomNav — mobile bottom navigation (shown on small screens only)
// =====================================================================
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", icon: "🏠", label: "Home" },
  { to: "/expenses", icon: "💸", label: "Expenses" },
  { to: "/calendar", icon: "📅", label: "Calendar" },
  { to: "/shopping", icon: "🛒", label: "Shopping" },
  { to: "/chat", icon: "💬", label: "Chat" },
  { to: "/family", icon: "👨‍👩‍👧‍👦", label: "Family" },
  { to: "/settings", icon: "⚙️", label: "Settings" },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          aria-label={item.label}
          className={({ isActive }) => `bn-item ${isActive ? "active" : ""}`}
        >
          <span className="bn-icon">{item.icon}</span>
          <span className="bn-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
