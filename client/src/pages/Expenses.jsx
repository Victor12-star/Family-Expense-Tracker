import {
  CalendarDays,
  Ellipsis,
  LockKeyhole,
  Plus,
  ReceiptText,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useFamily } from "../context/FamilyContext.jsx";
import { useCurrency } from "../context/CurrencyContext.jsx";
import { api } from "../api/client.js";
import { apiView, currentMonth, money, todayISO } from "../utils/format.js";
import { CATEGORIES } from "../utils/constants.js";
import { useLanguage } from "../context/LanguageContext.jsx";

const initialForm = () => ({
  name: "",
  amount: "",
  category: "Food",
  date: todayISO(),
  isPrivate: false,
  shareWithChat: true,
});

export default function Expenses() {
  const { family, view } = useFamily();
  const { currency } = useCurrency();
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [month, setMonth] = useState(currentMonth());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function openForm() {
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setFormError("");
    if (searchParams.has("add")) {
      const next = new URLSearchParams(searchParams);
      next.delete("add");
      setSearchParams(next, { replace: true });
    }
  }

  useEffect(() => {
    if (searchParams.get("add") === "1") openForm();
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    if (view === "family" && !family) {
      setExpenses([]);
      return;
    }
    const res = await api.get("/expenses", {
      params: {
        familyId: view === "family" ? family?.id : undefined,
        view: apiView(view),
      },
    });
    setExpenses(res.data);
  }

  useEffect(() => {
    load().catch(() => setExpenses([]));
  }, [family, view]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e) {
    e.preventDefault();
    if (submitting) return;
    if (view === "family" && !family) {
      setFormError("Create or join a family before adding a family expense.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await api.post("/expenses", {
        ...form,
        familyId: view === "family" ? family.id : null,
        view,
        currency,
        amount: Number.parseFloat(form.amount),
      });
      setForm(initialForm());
      closeForm();
      await load();
    } catch (error) {
      setFormError(error.response?.data?.message || "The expense could not be added. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this expense?")) return;
    await api.delete(`/expenses/${id}`);
    await load();
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return expenses.filter((expense) => {
      const matchMonth = !month || (expense.date || "").startsWith(month);
      const matchCategory = category === "All" || expense.category === category;
      const matchSearch = !term || [expense.name, expense.category, expense.user?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
      return matchMonth && matchCategory && matchSearch;
    });
  }, [expenses, month, category, search]);

  const total = filtered.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const monthLabel = month
    ? new Date(`${month}-01T12:00:00`).toLocaleDateString([], { month: "long", year: "numeric" })
    : "All expenses";

  return (
    <div className="page expenses-page">
      <div className="page-head modern-head">
        <div>
          <h1>{t("expenses", "Expenses")}</h1>
          <p className="subtitle">{t("trackSpending", "Track, find and review your spending.")}</p>
        </div>
        <button className="btn primary" onClick={openForm} type="button">
          <Plus size={18} /> {t("addExpense", "Add expense")}
        </button>
      </div>

      <section className="expense-overview" aria-label="Expense summary">
        <div>
          <span className="eyebrow">{monthLabel}</span>
          <strong>{money(total, currency)}</strong>
          <small>{filtered.length} {filtered.length === 1 ? "transaction" : "transactions"}</small>
        </div>
      </section>

      <section className="card filter-card">
        <div className="filter-grid">
          <label className="search-field">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Search expenses</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchExpenses", "Search expenses")} />
          </label>
          <label className="compact-field">
            <CalendarDays size={17} />
            <span className="sr-only">Month</span>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </label>
          <label className="compact-field">
            <SlidersHorizontal size={17} />
            <span className="sr-only">Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="All">{t("all", "All")}</option>
              {Object.keys(CATEGORIES).map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="card expense-list-card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><ReceiptText size={28} /></div>
            <h2>{t("noExpensesFound", "No expenses found")}</h2>
            <p>{expenses.length === 0 ? "Your expenses will appear here once you start tracking them." : "Try changing your search or filters."}</p>
            {expenses.length === 0 && (
              <button className="btn secondary" type="button" onClick={openForm}>
                <Plus size={17} /> Add your first expense
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-scroll desktop-expense-table">
              <table className="table modern-table">
                <thead>
                  <tr>
                    <th>{t("date", "Date")}</th>
                    <th>{t("description", "Description")}</th>
                    {view === "family" && <th>{t("addedBy", "Added by")}</th>}
                    <th>{t("category", "Category")}</th>
                    <th className="num">{t("amount", "Amount")}</th>
                    <th><span className="sr-only">{t("actions", "Actions")}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((expense) => (
                    <tr key={expense.id}>
                      <td>{new Date(expense.date).toLocaleDateString()}</td>
                      <td>
                        <div className="expense-name">
                          {expense.name}
                          {expense.isPrivate && <LockKeyhole size={14} aria-label="Private expense" />}
                        </div>
                      </td>
                      {view === "family" && <td>{expense.user?.name || "You"}</td>}
                      <td><span className="badge">{expense.category || "Other"}</span></td>
                      <td className="num amount-cell">{money(expense.amount, currency)}</td>
                      <td>
                        <button className="icon-btn danger-icon" type="button" onClick={() => remove(expense.id)} aria-label={`Delete ${expense.name}`}>
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-expense-list">
              {filtered.map((expense) => (
                <article className="expense-mobile-card" key={expense.id}>
                  <div className="expense-mobile-main">
                    <div>
                      <strong>{expense.name}</strong>
                      <span>{expense.category || "Other"} · {new Date(expense.date).toLocaleDateString()}</span>
                      {view === "family" && <small>Added by {expense.user?.name || "You"}</small>}
                    </div>
                    <span className="mobile-amount">{money(expense.amount, currency)}</span>
                  </div>
                  <button className="icon-btn" type="button" onClick={() => remove(expense.id)} aria-label={`Delete ${expense.name}`}>
                    <Trash2 size={17} />
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {showForm && (
        <div className="drawer-layer" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && closeForm()}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="add-expense-title">
            <div className="drawer-head">
              <div>
                <span className="eyebrow">{t("newTransaction", "New transaction")}</span>
                <h2 id="add-expense-title">{t("addExpense", "Add expense")}</h2>
              </div>
              <button className="icon-btn" type="button" onClick={closeForm} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <form className="drawer-form" onSubmit={submit}>
              <label className="field">
                <span>{t("description", "Description")}</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Weekly groceries" required autoFocus />
              </label>
              <label className="field">
                <span>Amount ({currency})</span>
                <input type="number" min="0" step="0.01" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" required />
              </label>
              <label className="field">
                <span>{t("date", "Date")}</span>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </label>
              <label className="field">
                <span>{t("category", "Category")}</span>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {Object.keys(CATEGORIES).map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              {view === "family" && (
                <>
                  <label className="privacy-option">
                    <div className="privacy-copy">
                      <LockKeyhole size={18} />
                      <span><strong>{t("privateExpense", "Private expense")}</strong><small>Only you can see this expense.</small></span>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle"
                      checked={form.isPrivate}
                      onChange={(e) => setForm({ ...form, isPrivate: e.target.checked, shareWithChat: e.target.checked ? false : form.shareWithChat })}
                    />
                  </label>
                  <label className={`privacy-option ${form.isPrivate ? "is-disabled" : ""}`}>
                    <div className="privacy-copy">
                      <span aria-hidden="true">💬</span>
                      <span><strong>{t("shareFamilyChat", "Share in family chat")}</strong><small>Show this expense in the Family Chat sidebar.</small></span>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle"
                      checked={form.shareWithChat}
                      disabled={form.isPrivate}
                      onChange={(e) => setForm({ ...form, shareWithChat: e.target.checked })}
                    />
                  </label>
                </>
              )}
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <div className="drawer-actions">
                <button className="btn ghost" type="button" onClick={closeForm}>{t("cancel", "Cancel")}</button>
                <button className="btn primary" type="submit" disabled={submitting}>
                  <Plus size={18} /> {submitting ? "Adding…" : "Add expense"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
