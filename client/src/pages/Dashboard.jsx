import {
  AlarmClock,
  CalendarDays,
  Plus,
  ReceiptText,
  ShoppingBasket,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useFamily } from "../context/FamilyContext.jsx";
import { useCurrency } from "../context/CurrencyContext.jsx";
import { api } from "../api/client.js";
import { apiView, currentMonth, money } from "../utils/format.js";

function greetingFor(date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const { family, view } = useFamily();
  const { currency } = useCurrency();
  const [expenses, setExpenses] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!family) {
      setExpenses([]);
      setReminders([]);
      return;
    }

    Promise.allSettled([
      api.get("/expenses", { params: { familyId: family.id, view: apiView(view) } }),
      api.get(`/reminders/${family.id}`),
    ]).then(([expenseResult, reminderResult]) => {
      if (expenseResult.status === "fulfilled") setExpenses(expenseResult.value.data);
      if (reminderResult.status === "fulfilled") setReminders(reminderResult.value.data);
    });
  }, [family, view]);

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => (expense.date || "").startsWith(currentMonth())),
    [expenses]
  );
  const monthTotal = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayReminders = reminders.filter((reminder) => (reminder.date || "").slice(0, 10) === localToday);

  const timeStr = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const firstName = user?.name?.trim()?.split(/\s+/)[0] || "there";

  return (
    <div className="page dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-welcome">
          <span className="eyebrow">{view === "family" ? "Family workspace" : "Single workspace"}</span>
          <h1>{greetingFor(now)}, {firstName}</h1>
          <p>Here is your financial overview for today.</p>
        </div>
        <Link to="/expenses" className="btn primary hero-add">
          <Plus size={18} aria-hidden="true" />
          Add expense
        </Link>
      </section>

      <section className="datetime-card compact" aria-label="Current date and time">
        <div className="dt-left">
          <CalendarDays size={22} aria-hidden="true" />
          <div>
            <strong>{now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</strong>
            <span>{now.getFullYear()}</span>
          </div>
        </div>
        <div className="dt-right">
          <span className="dt-time">{timeStr}</span>
          <span className="dt-live">Live</span>
        </div>
      </section>

      <section className="summary" aria-label="Financial summary">
        <article className="stat">
          <div className="stat-icon"><ReceiptText size={20} /></div>
          <span className="stat-label">This month</span>
          <output className="stat-value">{money(monthTotal, currency)}</output>
          <span className="stat-note">{monthExpenses.length} {monthExpenses.length === 1 ? "expense" : "expenses"}</span>
        </article>
        <article className="stat">
          <div className="stat-icon"><Wallet size={20} /></div>
          <span className="stat-label">Monthly budget</span>
          <output className="stat-value">—</output>
          <Link to="/settings" className="stat-note stat-link">Set a budget</Link>
        </article>
        <article className="stat">
          <div className="stat-icon"><AlarmClock size={20} /></div>
          <span className="stat-label">Due today</span>
          <output className="stat-value">{todayReminders.length}</output>
          <span className="stat-note">{todayReminders.length === 1 ? "reminder" : "reminders"}</span>
        </article>
      </section>

      {todayReminders.length > 0 && (
        <section className="card">
          <div className="card-head">
            <div>
              <span className="eyebrow">Today</span>
              <h2>Upcoming reminders</h2>
            </div>
            <Link to="/calendar" className="link-btn">View calendar</Link>
          </div>
          {todayReminders.slice(0, 4).map((reminder) => (
            <div className="list-item" key={reminder.id}>
              <div className="list-icon"><AlarmClock size={18} /></div>
              <div className="list-copy">
                <div className="li-title">{reminder.title}</div>
                <div className="li-sub">{reminder.time || "Any time"}</div>
              </div>
              <span className="badge">{reminder.time || "Today"}</span>
            </div>
          ))}
        </section>
      )}

      <section className="quick-actions" aria-label="Quick actions">
        <Link to="/expenses" className="qa"><ReceiptText size={22} /><span>Expense</span></Link>
        <Link to="/calendar" className="qa"><AlarmClock size={22} /><span>Reminder</span></Link>
        <Link to="/shopping" className="qa"><ShoppingBasket size={22} /><span>Shopping</span></Link>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <span className="eyebrow">Latest activity</span>
            <h2>Recent expenses</h2>
          </div>
          <Link to="/expenses" className="link-btn">See all</Link>
        </div>
        {monthExpenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><ReceiptText size={28} /></div>
            <h3>No expenses yet this month</h3>
            <p>Your recent expenses will appear here once you start tracking them.</p>
            <Link to="/expenses" className="btn secondary"><Plus size={17} /> Add first expense</Link>
          </div>
        ) : (
          monthExpenses.slice(0, 5).map((expense) => (
            <div className="list-item" key={expense.id}>
              <div className="list-icon"><ReceiptText size={18} /></div>
              <div className="list-copy">
                <div className="li-title">{expense.name}</div>
                <div className="li-sub">{expense.category || "Other"}</div>
              </div>
              <span className="li-amt">{money(expense.amount, currency)}</span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
