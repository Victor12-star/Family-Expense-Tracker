import {
  CalendarDays,
  Home,
  MessagesSquare,
  ReceiptText,
  Settings,
  ShoppingBasket,
  UsersRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useFamily } from "../context/FamilyContext.jsx";

const sharedItems = [
  { to: "/", Icon: Home, label: "Home" },
  { to: "/expenses", Icon: ReceiptText, label: "Expenses" },
  { to: "/calendar", Icon: CalendarDays, label: "Calendar" },
  { to: "/shopping", Icon: ShoppingBasket, label: "Shopping" },
  { to: "/settings", Icon: Settings, label: "Settings" },
];

const familyItems = [
  { to: "/chat", Icon: MessagesSquare, label: "Chat" },
  { to: "/family", Icon: UsersRound, label: "Family" },
];

export default function BottomNav() {
  const { view } = useFamily();
  const items = view === "family"
    ? [...sharedItems.slice(0, 4), ...familyItems, sharedItems[4]]
    : sharedItems;

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map(({ to, Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          aria-label={label}
          className={({ isActive }) => `bn-item ${isActive ? "active" : ""}`}
        >
          <Icon className="bn-icon" size={20} strokeWidth={2} aria-hidden="true" />
          <span className="bn-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
