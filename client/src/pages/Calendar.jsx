import {
  AlarmClock,
  Bell,
  BellRing,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Repeat2,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFamily } from "../context/FamilyContext.jsx";
import { api } from "../api/client.js";
import { todayISO } from "../utils/format.js";
import { playReminderChime } from "../utils/reminderAudio.js";

const SOUND_KEY = "fet_reminder_sound";
const initialForm = () => ({
  title: "",
  date: todayISO(),
  hour: "12",
  minute: "00",
  second: "00",
  repeat: "NONE",
  category: "Bills",
  remindBeforeMinutes: "0",
});

function ymd(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseTimeParts(value = "12:00:00") {
  const [hour = "12", minute = "00", second = "00"] = value.split(":");
  return { hour, minute, second };
}

export default function Calendar() {
  const { family, view } = useFamily();
  const [reminders, setReminders] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(() => new Date());
  const [sound, setSound] = useState(() => localStorage.getItem(SOUND_KEY) || "soft");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    if (view === "family" && !family) {
      setReminders([]);
      return;
    }
    const res = await api.get("/reminders", {
      params: { view, familyId: view === "family" ? family?.id : undefined },
    });
    setReminders(res.data);
  }

  useEffect(() => {
    load().catch(() => setReminders([]));
  }, [family?.id, view]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e) {
    e.preventDefault();
    if (saving) return;
    if (view === "family" && !family) {
      setFormError("Create or join a family before adding a family reminder.");
      return;
    }
    if (!form.title.trim()) {
      setFormError("Enter a reminder title.");
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      await api.post("/reminders", {
        view,
        familyId: view === "family" ? family?.id : null,
        title: form.title.trim(),
        date: form.date,
        time: `${form.hour}:${form.minute}:${form.second}`,
        repeat: form.repeat,
        category: form.category,
        remindBeforeMinutes: Number(form.remindBeforeMinutes || 0),
        sound,
      });
      setForm(initialForm());
      setShowForm(false);
      await load();
      window.dispatchEvent(new Event("fet:reminders-changed"));
      setNotice("Reminder added successfully.");
      window.setTimeout(() => setNotice(""), 4000);
    } catch (error) {
      setFormError(error.response?.data?.message || "The reminder could not be added. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this reminder?")) return;
    await api.delete(`/reminders/${id}`);
    await load();
    window.dispatchEvent(new Event("fet:reminders-changed"));
  }

  async function clearMine() {
    if (!reminders.length || !window.confirm("Clear all reminders you created in this workspace? This cannot be undone.")) return;
    await api.post("/reminders/clear", { view, familyId: view === "family" ? family?.id : null });
    await load();
    window.dispatchEvent(new Event("fet:reminders-changed"));
  }

  async function requestNotifications() {
    if (!("Notification" in window)) {
      alert("Browser notifications are not supported on this device.");
      return;
    }
    if (Notification.permission === "default") await Notification.requestPermission();
  }

  const calendarDays = useMemo(() => {
    const first = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1);
    const start = new Date(first);
    const mondayIndex = (first.getDay() + 6) % 7;
    start.setDate(first.getDate() - mondayIndex);
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [displayMonth]);

  const remindersByDate = useMemo(() => {
    const map = new Map();
    reminders.forEach((reminder) => {
      const key = (reminder.date || "").slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(reminder);
    });
    return map;
  }, [reminders]);

  const upcoming = [...reminders]
    .sort((a, b) => `${a.date || ""}${a.time || ""}`.localeCompare(`${b.date || ""}${b.time || ""}`))
    .filter((reminder) => (reminder.date || "").slice(0, 10) >= todayISO());

  return (
    <div className="page calendar-page">
      <div className="page-head modern-head">
        <div>
          <span className="eyebrow">{view === "family" ? "Family workspace" : "Single workspace"}</span>
          <h1>Calendar & reminders</h1>
          <p className="subtitle">Keep bills, appointments and important dates in view.</p>
        </div>
        <button className="btn primary" type="button" onClick={() => { setFormError(""); setShowForm(true); }}>
          <Plus size={18} /> Add reminder
        </button>
      </div>

      {notice && <div className="success-banner page-notice" role="status">{notice}</div>}

      <section className="reminder-toolbar card">
        <div className="reminder-sound-control">
          <Volume2 size={18} />
          <label>
            <span>Reminder sound</span>
            <select value={sound} onChange={(e) => { setSound(e.target.value); localStorage.setItem(SOUND_KEY, e.target.value); }}>
              <option value="soft">Soft chime</option>
              <option value="bell">Gentle bell</option>
              <option value="digital">Digital</option>
              <option value="none">None</option>
            </select>
          </label>
          <button className="btn ghost" type="button" onClick={async () => {
            const played = await playReminderChime(sound);
            setNotice(played ? "Sound is enabled." : "Your browser blocked sound. Click the page once and try Preview again.");
            window.setTimeout(() => setNotice(""), 4000);
          }}>Preview</button>
        </div>
        <button className="btn ghost" type="button" onClick={requestNotifications}>
          <Bell size={17} /> Browser notifications
        </button>
      </section>

      <div className="calendar-layout">
        <section className="card calendar-card">
          <div className="calendar-head">
            <div>
              <span className="eyebrow">Monthly view</span>
              <h2>{displayMonth.toLocaleDateString([], { month: "long", year: "numeric" })}</h2>
            </div>
            <div className="calendar-nav">
              <button className="icon-btn" type="button" aria-label="Previous month" onClick={() => setDisplayMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}><ChevronLeft size={20} /></button>
              <button className="btn ghost" type="button" onClick={() => setDisplayMonth(new Date())}>Today</button>
              <button className="icon-btn" type="button" aria-label="Next month" onClick={() => setDisplayMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}><ChevronRight size={20} /></button>
            </div>
          </div>
          <div className="calendar-weekdays" aria-hidden="true">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendar-grid">
            {calendarDays.map((day) => {
              const key = ymd(day);
              const dayReminders = remindersByDate.get(key) || [];
              const outside = day.getMonth() !== displayMonth.getMonth();
              const today = key === todayISO();
              return (
                <button
                  className={`calendar-day ${outside ? "outside" : ""} ${today ? "today" : ""}`}
                  key={key}
                  type="button"
                  onClick={() => { setForm((current) => ({ ...current, date: key })); setShowForm(true); }}
                  aria-label={`${day.toLocaleDateString()}${dayReminders.length ? `, ${dayReminders.length} reminders` : ""}`}
                >
                  <span>{day.getDate()}</span>
                  {dayReminders.length > 0 && <i>{dayReminders.length}</i>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="card upcoming-card">
          <div className="card-head">
            <div>
              <span className="eyebrow">Next up</span>
              <h2>Upcoming reminders</h2>
            </div>
            {reminders.length > 0 && (
              <button className="btn ghost compact-danger" type="button" onClick={clearMine}>
                <Trash2 size={16} /> Clear reminders
              </button>
            )}
          </div>

          {upcoming.length === 0 ? (
            <div className="empty-state compact-empty">
              <div className="empty-icon"><BellRing size={27} /></div>
              <h3>No upcoming reminders</h3>
              <p>You're all caught up. Add a reminder so you don't miss an important payment or event.</p>
              <button className="btn secondary" type="button" onClick={() => setShowForm(true)}><Plus size={17} /> Add reminder</button>
            </div>
          ) : upcoming.map((reminder) => (
            <article className="reminder-row" key={reminder.id}>
              <div className="list-icon"><AlarmClock size={18} /></div>
              <div className="list-copy">
                <strong>{reminder.title}</strong>
                <span>{reminder.category || "Other"} · {new Date(reminder.date).toLocaleDateString()} · {reminder.time || "Any time"}</span>
                {reminder.repeat && reminder.repeat !== "NONE" && <small><Repeat2 size={12} /> {reminder.repeat.toLowerCase()}</small>}
              </div>
              <button className="icon-btn danger-icon" type="button" onClick={() => remove(reminder.id)} aria-label={`Delete ${reminder.title}`}><Trash2 size={17} /></button>
            </article>
          ))}
        </section>
      </div>

      {showForm && (
        <div className="drawer-layer" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="add-reminder-title">
            <div className="drawer-head">
              <div><span className="eyebrow">Schedule</span><h2 id="add-reminder-title">Add reminder</h2></div>
              <button className="icon-btn" type="button" onClick={() => setShowForm(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <form className="drawer-form" onSubmit={submit}>
              {formError && <div className="error-banner" role="alert">{formError}</div>}
              <label className="field"><span>Title</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Electricity bill" required autoFocus /></label>
              <label className="field"><span>Date</span><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>
              <fieldset className="time-fieldset">
                <legend><Clock3 size={16} /> Time</legend>
                <div className="time-parts">
                  <label><span>Hour</span><input type="number" min="0" max="23" value={form.hour} onChange={(e) => setForm({ ...form, hour: String(Math.max(0, Math.min(23, Number(e.target.value || 0)))).padStart(2, "0") })} /></label>
                  <b>:</b>
                  <label><span>Minute</span><input type="number" min="0" max="59" value={form.minute} onChange={(e) => setForm({ ...form, minute: String(Math.max(0, Math.min(59, Number(e.target.value || 0)))).padStart(2, "0") })} /></label>
                  <b>:</b>
                  <label><span>Second</span><input type="number" min="0" max="59" value={form.second} onChange={(e) => setForm({ ...form, second: String(Math.max(0, Math.min(59, Number(e.target.value || 0)))).padStart(2, "0") })} /></label>
                </div>
              </fieldset>
              <label className="field"><span>Category</span>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option>Bills</option><option>Groceries</option><option>Shopping</option><option>Food & Dining</option>
                  <option>Rent</option><option>Subscription</option><option>School</option><option>Transport</option>
                  <option>Appointment</option><option>Family</option><option>Birthday</option><option>Work</option><option>Other</option>
                </select>
              </label>
              <label className="field"><span>Remind me</span>
                <select value={form.remindBeforeMinutes} onChange={(e) => setForm({ ...form, remindBeforeMinutes: e.target.value })}>
                  <option value="0">At event time</option>
                  <option value="5">5 minutes before</option>
                  <option value="10">10 minutes before</option>
                  <option value="30">30 minutes before</option>
                  <option value="60">1 hour before</option>
                  <option value="1440">1 day before</option>
                </select>
              </label>
              <label className="field"><span>Repeat</span>
                <select value={form.repeat} onChange={(e) => setForm({ ...form, repeat: e.target.value })}>
                  <option value="NONE">Never</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </label>
              <p className="form-note"><Bell size={15} /> Keep the app open for sound alerts.</p>
              <div className="drawer-actions">
                <button className="btn ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn primary" type="submit" disabled={saving}><Plus size={17} /> {saving ? "Adding…" : "Add reminder"}</button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
