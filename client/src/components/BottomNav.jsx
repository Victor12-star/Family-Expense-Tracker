import {
  CalendarDays,
  Home,
  Menu,
  MessagesSquare,
  ReceiptText,
  Settings,
  ShoppingBasket,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useFamily } from "../context/FamilyContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const sharedItems = [
  { to: "/", Icon: Home, key: "home", label: "Home" },
  { to: "/expenses", Icon: ReceiptText, key: "expenses", label: "Expenses" },
  { to: "/calendar", Icon: CalendarDays, key: "calendar", label: "Calendar" },
  { to: "/shopping", Icon: ShoppingBasket, key: "shopping", label: "Shopping" },
  { to: "/settings", Icon: Settings, key: "settings", label: "Settings" },
];

const familyItems = [
  { to: "/chat", Icon: MessagesSquare, key: "chat", label: "Chat" },
  { to: "/family", Icon: UsersRound, key: "family", label: "Family" },
];

export default function BottomNav() {
  const { view } = useFamily();
  const { t } = useLanguage();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = view === "family"
    ? [...sharedItems.slice(0, 3), familyItems[0]]
    : sharedItems;
  const moreItems = [sharedItems[3], familyItems[1], sharedItems[4]];
  const moreActive = moreItems.some(({ to }) => location.pathname === to);

  useEffect(() => setMoreOpen(false), [location.pathname, view]);

  return (
    <>
      {view === "family" && moreOpen && (
        <div className="mobile-more-layer" role="presentation" onClick={() => setMoreOpen(false)}>
          <section className="mobile-more-sheet" role="dialog" aria-modal="true" aria-label="More navigation" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-more-head"><strong>{t("more", "More")}</strong><button type="button" className="icon-btn" onClick={() => setMoreOpen(false)} aria-label="Close menu"><X size={20} /></button></div>
            {moreItems.map(({ to, Icon, key, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `mobile-more-link ${isActive ? "active" : ""}`}>
                <Icon size={20} aria-hidden="true" /><span>{t(key, label)}</span>
              </NavLink>
            ))}
          </section>
        </div>
      )}
      <nav className="bottom-nav" aria-label="Main navigation">
        {items.map(({ to, Icon, key, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            aria-label={label}
            className={({ isActive }) => `bn-item ${isActive ? "active" : ""}`}
          >
            <Icon className="bn-icon" size={20} strokeWidth={2} aria-hidden="true" />
            <span className="bn-label">{t(key, label)}</span>
          </NavLink>
        ))}
        {view === "family" && (
          <button type="button" className={`bn-item bn-more ${moreActive || moreOpen ? "active" : ""}`} onClick={() => setMoreOpen((open) => !open)} aria-expanded={moreOpen} aria-label="More navigation">
            <Menu className="bn-icon" size={20} strokeWidth={2} aria-hidden="true" />
            <span className="bn-label">{t("more", "More")}</span>
          </button>
        )}
      </nav>
    </>
  );
}
