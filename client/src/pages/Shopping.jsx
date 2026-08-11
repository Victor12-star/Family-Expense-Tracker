// =====================================================================
// Shopping & Activities page
// =====================================================================
import { useEffect, useState } from "react";
import { useFamily } from "../context/FamilyContext.jsx";
import { api } from "../api/client.js";

export default function Shopping() {
  const { family } = useFamily();
  const [shopping, setShopping] = useState([]);
  const [activities, setActivities] = useState([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    if (!family) return;
    api.get(`/${family.id}/shopping`).then((r) => setShopping(r.data)).catch(() => {});
    api.get(`/${family.id}/activities`).then((r) => setActivities(r.data)).catch(() => {});
  }, [family]);

  async function addItem(e) {
    e.preventDefault();
    if (!newItem.trim()) return;
    await api.post(`/${family.id}/shopping`, { name: newItem });
    setNewItem("");
    const r = await api.get(`/${family.id}/shopping`);
    setShopping(r.data);
  }

  async function toggleItem(id) {
    await api.patch(`/shopping/${id}`);
    const r = await api.get(`/${family.id}/shopping`);
    setShopping(r.data);
  }

  return (
    <div className="page">
      <div className="page-head"><h2>Shopping</h2></div>

      <form className="card add-inline" onSubmit={addItem}>
        <label className="sr-only" htmlFor="new-shopping-item">Add shopping item</label>
        <input id="new-shopping-item" placeholder="Add item…" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
        <button className="btn secondary" type="submit">Add</button>
      </form>

      <div className="card">
        {shopping.length === 0 ? (
          <p className="empty">No shopping items.</p>
        ) : (
          shopping.map((s) => (
            <div className="list-item" key={s.id}>
              <button
                className={`checkbox ${s.done ? "done" : ""}`}
                onClick={() => toggleItem(s.id)}
              >✓</button>
              <div className={`li-title ${s.done ? "strike" : ""}`}>{s.name}</div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div className="card-head"><h3>Activities ({activities.length})</h3></div>
        {activities.map((a) => (
          <div className="list-item" key={a.id}>
            <span className="li-title">{a.title}</span>
            <span className="li-sub">{a.done ? "done" : "pending"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
