// =====================================================================
// Expenses page — list, add, delete expenses (family/individual view)
// =====================================================================
import { useEffect, useState } from "react";
import { useFamily } from "../context/FamilyContext.jsx";
import { useCurrency } from "../context/CurrencyContext.jsx";
import { api } from "../api/client.js";
import { money, todayISO } from "../utils/format.js";
import { CATEGORIES } from "../utils/constants.js";

export default function Expenses() {
  const { family, view } = useFamily();
  const { currency } = useCurrency();
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ name: "", amount: "", category: "Food", date: todayISO(), isPrivate: false });
  const [showForm, setShowForm] = useState(false);

  async function load() {
    if (!family) return;
    const res = await api.get("/expenses", { params: { familyId: family.id, view } });
    setExpenses(res.data);
  }

  useEffect(() => { load(); }, [family, view]); // eslint-disable-line

  async function submit(e) {
    e.preventDefault();
    await api.post("/expenses", { ...form, familyId: family.id, amount: parseFloat(form.amount) });
    setForm({ name: "", amount: "", category: "Food", date: todayISO(), isPrivate: false });
    setShowForm(false);
    load();
  }

  async function remove(id) {
    await api.delete(`/expenses/${id}`);
    load();
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="page">
      <div className="page-head">
        <h2>Expenses</h2>
        <button className="btn primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {showForm && (
        <form className="card expense-form" onSubmit={submit}>
          <label className="field"><span>Description</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <div className="two-col">
            <label className="field"><span>Amount</span>
              <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </label>
            <label className="field"><span>Date</span>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </label>
          </div>
          <label className="field"><span>Category</span>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {Object.keys(CATEGORIES).map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="toggle-row">
            <span>Private (only me)</span>
            <input type="checkbox" className="toggle" checked={form.isPrivate} onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })} />
          </label>
          <button className="btn primary" type="submit">Add Expense</button>
        </form>
      )}

      <div className="card">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Description</th><th>By</th><th>Category</th><th className="num">Amount</th><th></th></tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td>{e.date?.slice(0, 10)}</td>
                  <td>{e.name}{e.isPrivate ? " 🔒" : ""}</td>
                  <td>{e.user?.name}</td>
                  <td><span className="badge">{e.category}</span></td>
                  <td className="num">{money(e.amount, currency)}</td>
                  <td><button className="icon-btn" onClick={() => remove(e.id)}>🗑️</button></td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan="6" className="empty">No expenses.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="total-row">Total: {money(total, currency)}</div>
      </div>
    </div>
  );
}
