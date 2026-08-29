import {
  AlarmClock,
  Plus,
  ReceiptText,
  ShoppingBasket,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useFamily } from "../context/FamilyContext.jsx";
import { useCurrency } from "../context/CurrencyContext.jsx";
import { api } from "../api/client.js";
import { apiView, currentMonth, money } from "../utils/format.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import LanguageSwitch from "../components/LanguageSwitch.jsx";

function greetingFor(date, t) {
  const hour = date.getHours();
  if (hour < 12) return t("goodMorning", "Good morning");
  if (hour < 17) return t("goodAfternoon", "Good afternoon");
  return t("goodEvening", "Good evening");
}

export default function Dashboard() {
  const { user } = useAuth();
  const { family, view } = useFamily();
  const { currency } = useCurrency();
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [budget, setBudget] = useState(null);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [showBudget, setShowBudget] = useState(false);
  const [budgetNotice, setBudgetNotice] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);
  const now = new Date();

  useEffect(() => {
    if (view === "family" && !family) {
      setExpenses([]);
      setReminders([]);
      setBudget(null);
      return;
    }

    Promise.allSettled([
      api.get("/expenses", {
        params: {
          familyId: view === "family" ? family?.id : undefined,
          view: apiView(view),
        },
      }),
      api.get("/reminders", {
        params: {
          familyId: view === "family" ? family?.id : undefined,
          view,
        },
      }),
      api.get("/budgets/summary", {
        params: {
          familyId: view === "family" ? family?.id : undefined,
          view,
          month: currentMonth(),
        },
      }),
    ]).then(([expenseResult, reminderResult, budgetResult]) => {
      if (expenseResult.status === "fulfilled") setExpenses(expenseResult.value.data);
      if (reminderResult.status === "fulfilled") setReminders(reminderResult.value.data);
      if (budgetResult.status === "fulfilled") {
        setBudget(budgetResult.value.data);
        setBudgetAmount(budgetResult.value.data.budget?.amount ? String(budgetResult.value.data.budget.amount) : "");
      }
    });
  }, [family?.id, view]);

  async function saveBudget(event) {
    event.preventDefault();
    const amount = Number(budgetAmount);
    if (!Number.isFinite(amount) || amount <= 0 || savingBudget) return;

    setSavingBudget(true);
    setBudgetNotice("");
    try {
      await api.put("/budgets", {
        view,
        familyId: view === "family" ? family?.id : null,
        month: currentMonth(),
        amount,
        currency,
      });
      const response = await api.get("/budgets/summary", {
        params: {
          familyId: view === "family" ? family?.id : undefined,
          view,
          month: currentMonth(),
        },
      });
      setBudget(response.data);
      setShowBudget(false);
    } catch (error) {
      setBudgetNotice(error.response?.data?.message || "The budget could not be saved. Please try again.");
    } finally {
      setSavingBudget(false);
    }
  }

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => (expense.date || "").startsWith(currentMonth())),
    [expenses]
  );
  const monthTotal = monthExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayReminders = reminders.filter((reminder) => (reminder.date || "").slice(0, 10) === localToday);

  const firstName = user?.name?.trim()?.split(/\s+/)[0] || "there";

  return (
    <div className="page dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-welcome">
          <h1>{greetingFor(now, t)}, {firstName}</h1>
        </div>
        <div className="dashboard-hero-actions">
          <LanguageSwitch />
          <Link to="/expenses?add=1" className="btn primary hero-add">
            <Plus size={18} aria-hidden="true" />
            {t("addExpense", "Add expense")}
          </Link>
        </div>
      </section>

      <section className="summary" aria-label="Financial summary">
        <article className="stat">
          <div className="stat-icon"><ReceiptText size={20} /></div>
          <span className="stat-label">{t("thisMonth", "This month")}</span>
          <output className="stat-value">{money(monthTotal, currency)}</output>
          <span className="stat-note">{monthExpenses.length} {monthExpenses.length === 1 ? "expense" : "expenses"}</span>
        </article>
        <article className="stat">
          <div className="stat-icon"><Wallet size={20} /></div>
          <span className="stat-label">{t("monthlyBudget", "Monthly budget")}</span>
          <output className="stat-value">{budget?.budget ? money(budget.budget.amount, currency) : "—"}</output>
          {view === "family" && !family ? (
            <Link className="stat-note stat-link" to="/family">{t("createFamilyForBudget", "Create a family to set a budget")}</Link>
          ) : (
            <button type="button" className="stat-note stat-link stat-action" onClick={() => { setBudgetNotice(""); setShowBudget(true); }}>
              {budget?.budget ? t("editBudget", "Edit budget") : t("setBudget", "Set a budget")}
            </button>
          )}
        </article>
        <article className="stat">
          <div className="stat-icon"><AlarmClock size={20} /></div>
          <span className="stat-label">{t("dueToday", "Due today")}</span>
          <output className="stat-value">{todayReminders.length}</output>
          <span className="stat-note">{todayReminders.length === 1 ? "reminder" : "reminders"}</span>
        </article>
      </section>

      {todayReminders.length > 0 && (
        <section className="card">
          <div className="card-head">
            <div>
              <span className="eyebrow">{t("today", "Today")}</span>
              <h2>{t("upcomingReminders", "Upcoming reminders")}</h2>
            </div>
            <Link to="/calendar" className="link-btn">{t("viewCalendar", "View calendar")}</Link>
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
        <Link to="/expenses" className="qa"><ReceiptText size={22} /><span>{t("expense", "Expense")}</span></Link>
        <Link to="/calendar" className="qa"><AlarmClock size={22} /><span>{t("reminder", "Reminder")}</span></Link>
        <Link to="/shopping" className="qa"><ShoppingBasket size={22} /><span>{t("shopping", "Shopping")}</span></Link>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <span className="eyebrow">{t("latestActivity", "Latest activity")}</span>
            <h2>{t("recentExpenses", "Recent expenses")}</h2>
          </div>
          <Link to="/expenses" className="link-btn">{t("seeAll", "See all")}</Link>
        </div>
        {monthExpenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><ReceiptText size={28} /></div>
            <h3>{t("noExpenses", "No expenses yet this month")}</h3>
            <p>{t("recentExpensesHelp", "Your recent expenses will appear here once you start tracking them.")}</p>
            <Link to="/expenses" className="btn secondary"><Plus size={17} /> {t("addFirstExpense", "Add first expense")}</Link>
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

      {showBudget && (
        <div className="modal-layer">
          <form className="modal-card" onSubmit={saveBudget}>
            <div className="drawer-head">
              <div>
                <span className="eyebrow">{view === "family" ? "Family workspace" : "Single workspace"}</span>
                <h2>{t("monthlyBudget", "Monthly budget")}</h2>
              </div>
              <button className="icon-btn" type="button" onClick={() => setShowBudget(false)} aria-label="Close budget form">
                <X size={20} />
              </button>
            </div>
            <label className="field">
              <span>Budget amount ({currency})</span>
              <input type="number" min="0.01" step="0.01" value={budgetAmount} onChange={(event) => setBudgetAmount(event.target.value)} required autoFocus />
            </label>
            {budgetNotice && <p className="form-error" role="alert">{budgetNotice}</p>}
            <div className="drawer-actions">
              <button className="btn ghost" type="button" onClick={() => setShowBudget(false)}>{t("cancel", "Cancel")}</button>
              <button className="btn primary" type="submit" disabled={savingBudget}>{savingBudget ? "Saving…" : "Save budget"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
