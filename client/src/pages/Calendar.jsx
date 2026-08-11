// =====================================================================
// Calendar page — reminders with add, repeat, and delete
// =====================================================================
import { useEffect, useState } from "react";
import { useFamily } from "../context/FamilyContext.jsx";
import { api } from "../api/client.js";
import { todayISO } from "../utils/format.js";

export default function Calendar() {
  const { family } = useFamily();
  const [reminders, setReminders] = useState([]);
  const [form, setForm] = useState({ title: "", date: todayISO(), time: "12:00", repeat: "NONE" });

  async function load() {
    if (!family) return;
    try {
      const res = await api.get(`/reminders/${family.id}`);
      setReminders(res.data);
    } catch (_) {}
  }

  useEffect(() => { load(); }, [family]); // eslint-disable-line

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      await api.post(`/reminders/${family.id}`, form);
      setForm({ title: "", date: todayISO(), time: "12:00", repeat: "NONE" });
      await load();
    } catch (_) {}
  }

  async function remove(id) {
    try {
      await api.delete(`/reminders/${id}`);
      await load();
    } catch (_) {}
  }

  return (
    <div className="page">
      <div className="page-head"><h2>Calendar &amp; Reminders</h2></div>

      <form className="card expense-form" onSubmit={submit}>
        <h3>Add reminder</h3>
        <label className="field"><span>Title</span>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </label>
        <div className="two-col">
          <label className="field"><span>Date</span>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <label className="field"><span>Time</span>
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </label>
        </div>
        <label className="field"><span>Repeat</span>
          <select value={form.repeat} onChange={(e) => setForm({ ...form, repeat: e.target.value })}>
            <option value="NONE">Never</option>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </label>
        <button className="btn primary" type="submit">Add reminder</button>
      </form>

      <div className="card">
        <div className="card-head"><h3>Upcoming reminders</h3></div>
        {reminders.length === 0 ? (
          <p className="empty">No reminders. Add one above!</p>
        ) : (
          reminders.map((r) => (
            <div className="list-item" key={r.id}>
              <div>
                <div className="li-title">⏰ {r.title}</div>
                <div className="li-sub">
                  {r.date?.slice(0, 10)} · {r.time || "anytime"}
                  {r.repeat && r.repeat !== "NONE" ? ` · repeats ${r.repeat.toLowerCase()}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span className="badge">{r.time || "—"}</span>
                <button className="icon-btn" onClick={() => remove(r.id)} aria-label="Delete reminder">🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
