import {
  Check,
  CircleDollarSign,
  History,
  Plus,
  ShoppingBasket,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFamily } from "../context/FamilyContext.jsx";
import { useCurrency } from "../context/CurrencyContext.jsx";
import { api } from "../api/client.js";
import { currentMonth, money } from "../utils/format.js";

const SHOPPING_CATEGORIES = [
  "Groceries",
  "Household",
  "Personal Care",
  "Children",
  "Clothing",
  "Electronics",
  "Pharmacy",
  "School",
  "Food & Dining",
  "Other",
];

const UNITS = ["piece", "pack", "kg", "g", "litre", "ml", "other"];
const CHART_COLORS = [
  "#c7b91f",
  "#6fa7d8",
  "#4168ad",
  "#e85d78",
  "#f26b21",
  "#7c5aad",
  "#469b99",
  "#e3a72f",
  "#2d8bc4",
  "#8f63c9",
  "#dc567f",
  "#42a76d",
];

const initialItem = () => ({
  name: "",
  category: "Groceries",
  quantity: "1",
  unit: "piece",
  estimatedUnitPrice: "",
  store: "",
  notes: "",
});

export default function Shopping() {
  const { family, view } = useFamily();
  const { currency } = useCurrency();
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [budget, setBudget] = useState(null);
  const [summary, setSummary] = useState({ estimatedTotal: 0, itemCount: 0, purchasedCount: 0, completionPercent: 0 });
  const [showAdd, setShowAdd] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [itemForm, setItemForm] = useState(initialItem);
  const [actualTotal, setActualTotal] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetNotice, setBudgetNotice] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);
  const [loading, setLoading] = useState(false);

  const scopeParams = useMemo(() => ({
    view,
    familyId: view === "family" ? family?.id : undefined,
  }), [view, family?.id]);

  async function loadAll() {
    if (view === "family" && !family) return;
    const month = currentMonth();
    const [itemsRes, historyRes, summaryRes, budgetRes] = await Promise.all([
      api.get("/shopping", { params: scopeParams }),
      api.get("/shopping/history", { params: { ...scopeParams, limit: 50 } }),
      api.get("/shopping/summary", { params: scopeParams }),
      api.get("/budgets/summary", { params: { ...scopeParams, month } }),
    ]);
    setItems(itemsRes.data);
    setHistory(historyRes.data);
    setSummary(summaryRes.data);
    setBudget(budgetRes.data);
    setBudgetAmount(budgetRes.data.budget?.amount ? String(budgetRes.data.budget.amount) : "");
  }

  useEffect(() => {
    loadAll().catch(() => {});
  }, [scopeParams]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addItem(e) {
    e.preventDefault();
    if (!itemForm.name.trim() || loading) return;
    setLoading(true);
    try {
      await api.post("/shopping", {
        ...itemForm,
        view,
        familyId: view === "family" ? family?.id : null,
        quantity: Number(itemForm.quantity || 1),
        estimatedUnitPrice: itemForm.estimatedUnitPrice === "" ? null : Number(itemForm.estimatedUnitPrice),
      });
      setItemForm(initialItem());
      setShowAdd(false);
      await loadAll();
    } finally {
      setLoading(false);
    }
  }

  async function toggleItem(id) {
    await api.patch(`/shopping/${id}`);
    await loadAll();
  }

  async function deleteItem(id) {
    if (!window.confirm("Remove this item from the shopping list?")) return;
    await api.delete(`/shopping/${id}`);
    await loadAll();
  }

  async function clearPurchased() {
    await api.post("/shopping/clear-purchased", { view, familyId: view === "family" ? family?.id : null });
    await loadAll();
  }

  async function clearList() {
    if (!window.confirm("Clear the entire active shopping list?")) return;
    await api.post("/shopping/clear", { view, familyId: view === "family" ? family?.id : null });
    await loadAll();
  }

  async function saveBudget(e) {
    e.preventDefault();
    const amount = Number(budgetAmount);
    if (!Number.isFinite(amount) || amount <= 0 || savingBudget) return;
    if (view === "family" && !family?.id) {
      setBudgetNotice("Create or join a family before setting a Family budget, or switch to Single mode.");
      return;
    }

    setSavingBudget(true);
    setBudgetNotice("");
    try {
      await api.put("/budgets", {
        view,
        familyId: view === "family" ? family.id : null,
        month: currentMonth(),
        amount,
        currency,
      });
      setShowBudget(false);
      await loadAll();
    } catch (error) {
      const details = error.response?.data?.details;
      setBudgetNotice(Array.isArray(details) && details[0]?.message
        ? details[0].message
        : error.response?.data?.message || "The budget could not be saved. Please try again.");
    } finally {
      setSavingBudget(false);
    }
  }

  async function completeTrip(e) {
    e.preventDefault();
    if (actualTotal === "" || Number(actualTotal) < 0) return;
    setLoading(true);
    try {
      await api.post("/shopping/complete", {
        view,
        familyId: view === "family" ? family?.id : null,
        actualTotal: Number(actualTotal),
        currency,
        store: itemForm.store || undefined,
      });
      setActualTotal("");
      setShowComplete(false);
      await loadAll();
    } finally {
      setLoading(false);
    }
  }

  const projectedRemaining = budget?.remaining == null ? null : Number(budget.remaining) - Number(summary.estimatedTotal || 0);
  const storeSuggestions = [...new Set(history.map((trip) => trip.store).filter(Boolean))].slice(0, 12);

  const monthlyChartData = useMemo(() => {
    const grouped = new Map();
    history.forEach((trip) => {
      if (!trip.completedAt) return;
      const date = new Date(trip.completedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      grouped.set(key, (grouped.get(key) || 0) + Number(trip.actualTotal || 0));
    });
    return [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, amount]) => ({
        month: new Date(`${key}-01T12:00:00`).toLocaleDateString([], { month: "short" }),
        amount,
      }));
  }, [history]);

  return (
    <div className="page shopping-page">
      <div className="page-head modern-head">
        <div>
          <span className="eyebrow">{view === "family" ? "Family workspace" : "Single workspace"}</span>
          <h1>Shopping</h1>
          <p className="subtitle">Plan purchases, understand the cost, and keep your monthly budget in view.</p>
        </div>
        <button className="btn primary" type="button" onClick={() => setShowAdd(true)}><Plus size={18} /> Add item</button>
      </div>

      <section className="shopping-summary-grid">
        <article className="mini-stat"><Wallet size={20} /><span>Monthly budget</span><strong>{budget?.budget ? money(budget.budget.amount, currency) : "Not set"}</strong>{view === "family" && !family ? <Link to="/family">Create a family to set budget</Link> : <button type="button" onClick={() => { setBudgetNotice(""); setShowBudget(true); }}>{budget?.budget ? "Edit budget" : "Set budget"}</button>}</article>
        <article className="mini-stat"><CircleDollarSign size={20} /><span>Spent this month</span><strong>{money(budget?.spent || 0, currency)}</strong><small>{budget?.expenseCount || 0} expenses</small></article>
        <article className="mini-stat"><Wallet size={20} /><span>Remaining</span><strong>{budget?.remaining == null ? "—" : money(budget.remaining, currency)}</strong><small>{budget?.percentUsed == null ? "No budget set" : `${Math.round(budget.percentUsed)}% used`}</small></article>
        <article className="mini-stat accent-stat"><ShoppingBasket size={20} /><span>Current list estimate</span><strong>{money(summary.estimatedTotal || 0, currency)}</strong><small>{projectedRemaining == null ? `${summary.itemCount || 0} items` : `${money(projectedRemaining, currency)} projected remaining`}</small></article>
      </section>

      {budget?.budget && (
        <section className="budget-progress-card card">
          <div className="budget-progress-copy"><strong>Monthly budget progress</strong><span>{Math.round(budget.percentUsed || 0)}% used</span></div>
          <div className="progress-track"><span style={{ width: `${Math.min(Math.max(budget.percentUsed || 0, 0), 100)}%` }} /></div>
          {projectedRemaining != null && projectedRemaining < 0 && <p className="budget-warning">This shopping list is projected to put you {money(Math.abs(projectedRemaining), currency)} over your monthly budget.</p>}
        </section>
      )}

      <section className="card shopping-list-card">
        <div className="card-head">
          <div><span className="eyebrow">Current trip</span><h2>Shopping list</h2></div>
          <div className="card-actions">
            {summary.purchasedCount > 0 && <button className="btn ghost" type="button" onClick={clearPurchased}>Clear purchased</button>}
            {items.length > 0 && <button className="btn ghost compact-danger" type="button" onClick={clearList}><Trash2 size={16} /> Clear list</button>}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="empty-state"><div className="empty-icon"><ShoppingBasket size={28} /></div><h3>Your shopping list is empty</h3><p>Add items to estimate the cost of your next trip.</p><button className="btn secondary" type="button" onClick={() => setShowAdd(true)}><Plus size={17} /> Add first item</button></div>
        ) : (
          <div className="shopping-items">
            {items.map((item) => {
              const itemTotal = Number(item.quantity || 1) * Number(item.estimatedUnitPrice || 0);
              return (
                <article className={`shopping-item ${item.done ? "purchased" : ""}`} key={item.id}>
                  <button className={`purchase-check ${item.done ? "done" : ""}`} type="button" onClick={() => toggleItem(item.id)} aria-label={`${item.done ? "Mark unpurchased" : "Mark purchased"}: ${item.name}`}><Check size={17} /></button>
                  <div className="shopping-item-copy"><strong>{item.name}</strong><span>{item.category} · {Number(item.quantity)} {item.unit}{item.store ? ` · ${item.store}` : ""}</span>{item.estimatedUnitPrice != null && <small>{money(item.estimatedUnitPrice, currency)} each</small>}</div>
                  <strong className="shopping-item-total">{money(itemTotal, currency)}</strong>
                  <button className="icon-btn danger-icon" type="button" onClick={() => deleteItem(item.id)} aria-label={`Delete ${item.name}`}><Trash2 size={17} /></button>
                </article>
              );
            })}
          </div>
        )}

        {items.length > 0 && (
          <div className="shopping-footer">
            <div><span>{summary.purchasedCount} of {summary.itemCount} items purchased</span><div className="progress-track small"><span style={{ width: `${summary.completionPercent || 0}%` }} /></div></div>
            <button className="btn primary" type="button" onClick={() => { setActualTotal(String(summary.estimatedTotal || "")); setShowComplete(true); }}>Complete shopping</button>
          </div>
        )}
      </section>

      <section className="analytics-grid spending-chart-section">
        <article className="card chart-card spending-chart-card">
          <div className="card-head"><div><span className="eyebrow">History</span><h2>Shopping spending</h2><p className="chart-subtitle">Completed shopping totals by month</p></div></div>
          {monthlyChartData.length === 0 ? <p className="empty chart-empty">Complete a shopping trip to start building your spending chart.</p> : (
            <div className="chart-wrap shopping-bar-chart" role="img" aria-label="Bar chart showing completed shopping totals by month">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyChartData} margin={{ top: 16, right: 12, left: 4, bottom: 4 }} barCategoryGap="24%">
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 6" vertical={false} />
                  <XAxis dataKey="month" axisLine={{ stroke: "var(--border-strong)" }} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12, fontWeight: 650 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} width={64} tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={(value) => Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value)} />
                  <Tooltip cursor={{ fill: "rgba(79, 70, 229, 0.05)" }} formatter={(value) => [money(value, currency), "Spent"]} contentStyle={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--panel)", boxShadow: "0 12px 28px rgba(15, 23, 42, .12)" }} labelStyle={{ color: "var(--text)", fontWeight: 700 }} />
                  <Bar dataKey="amount" radius={[9, 9, 2, 2]} maxBarSize={62}>
                    {monthlyChartData.map((entry, index) => <Cell key={`${entry.month}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </section>

      <section className="card history-card">
        <div className="card-head"><div><span className="eyebrow">Completed trips</span><h2>Shopping history</h2></div><History size={20} /></div>
        {history.length === 0 ? <p className="empty">No completed shopping trips yet.</p> : history.slice(0, 8).map((trip) => (
          <article className="history-row" key={trip.id}><div><strong>{trip.store || "Shopping trip"}</strong><span>{trip.completedAt ? new Date(trip.completedAt).toLocaleDateString() : ""} · {trip.items?.length || 0} items</span></div><div className="history-amount"><strong>{money(trip.actualTotal || 0, trip.currency || currency)}</strong><small>Est. {money(trip.estimatedTotal || 0, trip.currency || currency)}</small></div></article>
        ))}
      </section>

      {showAdd && (
        <div className="drawer-layer" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setShowAdd(false)}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="add-shopping-title">
            <div className="drawer-head"><div><span className="eyebrow">Shopping list</span><h2 id="add-shopping-title">Add item</h2></div><button className="icon-btn" type="button" onClick={() => setShowAdd(false)} aria-label="Close"><X size={20} /></button></div>
            <form className="drawer-form" onSubmit={addItem}>
              <label className="field"><span>Item</span><input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="Milk, bread, detergent…" required autoFocus /></label>
              <div className="two-col">
                <label className="field"><span>Category</span><select value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}>{SHOPPING_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label className="field"><span>Store (optional)</span><input list="store-suggestions" value={itemForm.store} onChange={(e) => setItemForm({ ...itemForm, store: e.target.value })} placeholder="Any store worldwide" /><datalist id="store-suggestions">{storeSuggestions.map((storeName) => <option key={storeName} value={storeName} />)}</datalist></label>
              </div>
              <div className="three-col shopping-number-fields">
                <label className="field"><span>Quantity</span><input type="number" min="0.01" step="0.01" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} /></label>
                <label className="field"><span>Unit</span><select value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}>{UNITS.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
                <label className="field"><span>Est. unit price ({currency})</span><input type="number" min="0" step="0.01" value={itemForm.estimatedUnitPrice} onChange={(e) => setItemForm({ ...itemForm, estimatedUnitPrice: e.target.value })} placeholder="0.00" /></label>
              </div>
              <label className="field"><span>Notes (optional)</span><input value={itemForm.notes} onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })} placeholder="Brand, size, colour…" /></label>
              <div className="drawer-actions"><button className="btn ghost" type="button" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn primary" type="submit" disabled={loading}><Plus size={17} /> {loading ? "Adding…" : "Add to list"}</button></div>
            </form>
          </aside>
        </div>
      )}

      {showBudget && (
        <div className="modal-layer"><form className="modal-card" onSubmit={saveBudget}><div className="drawer-head"><div><span className="eyebrow">{new Date().toLocaleDateString([], { month: "long", year: "numeric" })}</span><h2>Monthly budget</h2></div><button className="icon-btn" type="button" onClick={() => setShowBudget(false)}><X size={20} /></button></div><label className="field"><span>Budget amount ({currency})</span><input type="number" min="0.01" step="0.01" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} required autoFocus /></label>{budgetNotice && <p className="form-error" role="alert">{budgetNotice}</p>}<div className="drawer-actions"><button className="btn ghost" type="button" onClick={() => setShowBudget(false)}>Cancel</button><button className="btn primary" type="submit" disabled={savingBudget}>{savingBudget ? "Saving…" : "Save budget"}</button></div></form></div>
      )}

      {showComplete && (
        <div className="modal-layer"><form className="modal-card" onSubmit={completeTrip}><div className="drawer-head"><div><span className="eyebrow">Finish trip</span><h2>Complete shopping</h2></div><button className="icon-btn" type="button" onClick={() => setShowComplete(false)} aria-label="Close"><X size={20} /></button></div><div className="completion-comparison"><span>Estimated total<strong>{money(summary.estimatedTotal || 0, currency)}</strong></span></div><label className="field"><span>Actual amount paid ({currency})</span><input type="number" min="0" step="0.01" value={actualTotal} onChange={(e) => setActualTotal(e.target.value)} required autoFocus /></label>{actualTotal !== "" && <p className="form-note">Difference: {money(Number(actualTotal) - Number(summary.estimatedTotal || 0), currency)}</p>}<div className="drawer-actions"><button className="btn ghost" type="button" onClick={() => setShowComplete(false)}>Cancel</button><button className="btn primary" type="submit" disabled={loading}>Complete & add expense</button></div></form></div>
      )}
    </div>
  );
}
