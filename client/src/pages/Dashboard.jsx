// =====================================================================
// Dashboard — home page with summary cards + quick actions
// =====================================================================
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useFamily } from "../context/FamilyContext.jsx";
import { useCurrency } from "../context/CurrencyContext.jsx";
import { api } from "../api/client.js";
import { money, currentMonth } from "../utils/format.js";

export default function Dashboard() {
  const { user } = useAuth();
  const { family, view } = useFamily();
  const { currency } = useCurrency();
  const [expenses, setExpenses] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [now, setNow] = useState(new Date());

  // Update the clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!family) return;
    api.get("/expenses", { params: { familyId: family.id, view } })
      .then((res) => setExpenses(res.data))
      .catch(() => {});
    api.get(`/reminders/${family.id}`)
      .then((res) => setReminders(res.data))
      .catch(() => {});
  }, [family, view]);

  // Format the current date and time
  const dateStr = now.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const monthExpenses = expenses.filter((e) => (e.date || "").startsWith(currentMonth()));
  const monthTotal = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);

  // Today's reminders (by date)
  const today = now.toISOString().slice(0, 10);
  const todayReminders = reminders.filter((r) => (r.date || "").slice(0, 10) === today);

  return (
    <div className="page">
      <div className="page-head">
        <div className="dash-brand">
          {/* Large app logo */}
          <img src="/logo.png" alt="Family Expense Tracker logo" className="dash-logo" />
          <div>
            <h2>Good day {user?.name} </h2>
            <p className="subtitle">{view === "family" ? "Family view" : "Individual view"}</p>
          </div>
        </div>
        <Link to="/expenses" className="btn primary">+ Add</Link>
      </div>

      {/* Modern date & time banner */}
      <section className="datetime-card" aria-label="Current date and time">
        <div className="dt-left">
          <span className="dt-weekday">{now.toLocaleDateString([], { weekday: "long" })}</span>
          <span className="dt-day">{now.getDate()}</span>
          <span className="dt-month">{now.toLocaleDateString([], { month: "long", year: "numeric" })}</span>
        </div>
        <div className="dt-right">
          <span className="dt-time">{timeStr}</span>
          <span className="dt-live" role="status" aria-live="off">● LIVE</span>
        </div>
      </section>

      <div className="summary">
        <article className="stat">
          <span className="stat-label">This month</span>
          <output className="stat-value">{money(monthTotal, currency)}</output>
          <span className="stat-note">{monthExpenses.length} expenses</span>
        </article>
        <article className="stat">
          <span className="stat-label">Budget</span>
          <output className="stat-value">—</output>
          <span className="stat-note">Set a budget</span>
        </article>
        <article className="stat">
          <span className="stat-label">Due today</span>
          <output className="stat-value">{todayReminders.length}</output>
          <span className="stat-note">reminders</span>
        </article>
      </div>

      {/* Today's reminders */}
      {todayReminders.length > 0 && (
        <div className="card">
          <div className="card-head">
            <h3>Today's reminders ⏰</h3>
            <Link to="/calendar" className="link-btn">All</Link>
          </div>
          {todayReminders.map((r) => (
            <div className="list-item" key={r.id}>
              <div>
                <div className="li-title">{r.title}</div>
                <div className="li-sub">{r.time || "anytime"}</div>
              </div>
              <span className="badge">{r.time || "—"}</span>
            </div>
          ))}
        </div>
      )}

      <div className="quick-actions">
        <Link to="/expenses" className="qa">💸 Expense</Link>
        <Link to="/calendar" className="qa">⏰ Reminder</Link>
        <Link to="/shopping" className="qa">🛒 Shopping</Link>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Recent expenses</h3>
          <Link to="/expenses" className="link-btn">See all</Link>
        </div>
        {monthExpenses.length === 0 ? (
          <p className="empty">No expenses yet this month.</p>
        ) : (
          monthExpenses.slice(0, 5).map((e) => (
            <div className="list-item" key={e.id}>
              <div>
                <div className="li-title">{e.name}</div>
                <div className="li-sub">{e.category}</div>
              </div>
              <span className="li-amt">{money(e.amount, currency)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
