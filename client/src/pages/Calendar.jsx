import {
  AlarmClock,
  Bell,
  BellRing,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MoreVertical,
  Plus,
  Repeat2,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFamily } from "../context/FamilyContext.jsx";
import { api } from "../api/client.js";
import { todayISO } from "../utils/format.js";
import { playReminderChime } from "../utils/reminderAudio.js";
import { useLanguage } from "../context/LanguageContext.jsx";

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
  const { t, locale } = useLanguage();
  const [reminders, setReminders] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(() => new Date());
  const [sound, setSound] = useState(() => localStorage.getItem(SOUND_KEY) || "soft");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef(null);

  useEffect(() => {
    function closeTools(event) {
      if (event.key === "Escape" || (event.type === "pointerdown" && !toolsRef.current?.contains(event.target))) {
        setToolsOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeTools);
    document.addEventListener("keydown", closeTools);
    return () => {
      document.removeEventListener("pointerdown", closeTools);
      document.removeEventListener("keydown", closeTools);
    };
  }, []);

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
          <h1>{t("calendarReminders", "Calendar & reminders")}</h1>
          <p className="subtitle">{t("calendarSubtitle", "Keep bills, appointments and important dates in view.")}</p>
        </div>
        <div className="page-head-actions">
          <button className="btn primary" type="button" onClick={() => { setFormError(""); setShowForm(true); }}>
            <Plus size={18} /> {t("addReminder", "Add reminder")}
          </button>
          <div className="calendar-tools" ref={toolsRef}>
            <button className="icon-btn calendar-tools-trigger" type="button" aria-label="Reminder options" aria-haspopup="menu" aria-expanded={toolsOpen} onClick={() => setToolsOpen((open) => !open)}>
              <MoreVertical size={20} />
            </button>
            {toolsOpen && (
              <section className="calendar-tools-menu card" role="menu" aria-label="Reminder options">
                <div className="calendar-tool-field">
                  <Volume2 size={18} aria-hidden="true" />
                  <label>
                    <span>{t("reminderSound", "Reminder sound")}</span>
                    <select value={sound} onChange={(event) => { setSound(event.target.value); localStorage.setItem(SOUND_KEY, event.target.value); }}>
                      <option value="soft">Soft chime</option>
                      <option value="bell">Gentle bell</option>
                      <option value="digital">Digital</option>
                      <option value="none">None</option>
                    </select>
                  </label>
                </div>
                <button className="calendar-tool-action" type="button" role="menuitem" onClick={async () => {
                  const played = await playReminderChime(sound);
                  setNotice(played ? "Sound is enabled." : "Your browser blocked sound. Click the page once and try Preview again.");
                  window.setTimeout(() => setNotice(""), 4000);
                }}><Volume2 size={17} /> {t("preview", "Preview sound")}</button>
                <button className="calendar-tool-action" type="button" role="menuitem" onClick={requestNotifications}>
                  <Bell size={17} /> {t("browserNotifications", "Browser notifications")}
                </button>
              </section>
            )}
          </div>
        </div>
      </div>

      {notice && <div className="success-banner page-notice" role="status">{notice}</div>}

      <div className="calendar-layout">
        <section className="card calendar-card">
          <div className="calendar-head">
            <div>
              <span className="eyebrow">{t("monthlyView", "Monthly view")}</span>
              <h2>{displayMonth.toLocaleDateString(locale, { month: "long", year: "numeric" })}</h2>
            </div>
            <div className="calendar-nav">
              <button className="icon-btn" type="button" aria-label="Previous month" onClick={() => setDisplayMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}><ChevronLeft size={20} /></button>
              <button className="btn ghost" type="button" onClick={() => setDisplayMonth(new Date())}>{t("today", "Today")}</button>
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
                  className={`calendar-day ${outside ? "outside" : ""} ${today ? "today" : ""} ${dayReminders.length ? "has-reminders" : ""}`}
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
              <h2>{t("upcomingReminders", "Upcoming reminders")}</h2>
            </div>
            {reminders.length > 0 && (
              <button className="btn ghost compact-danger" type="button" onClick={clearMine}>
                <Trash2 size={16} /> {t("clearReminders", "Clear reminders")}
              </button>
            )}
          </div>

          {upcoming.length === 0 ? (
            <div className="empty-state compact-empty">
              <div className="empty-icon"><BellRing size={27} /></div>
              <h3>{t("noUpcomingReminders", "No upcoming reminders")}</h3>
              <button className="btn secondary" type="button" onClick={() => setShowForm(true)}><Plus size={17} /> {t("addReminder", "Add reminder")}</button>
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
              <div><span className="eyebrow">{t("schedule", "Schedule")}</span><h2 id="add-reminder-title">{t("addReminder", "Add reminder")}</h2></div>
              <button className="icon-btn" type="button" onClick={() => setShowForm(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <form className="drawer-form" onSubmit={submit}>
              {formError && <div className="error-banner" role="alert">{formError}</div>}
              <label className="field"><span>{t("title", "Title")}</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Electricity bill" required autoFocus /></label>
              <label className="field"><span>{t("date", "Date")}</span><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>
              <fieldset className="time-fieldset">
                <legend><Clock3 size={16} /> Time</legend>
                <div className="time-parts">
                  <label><span>{t("hour", "Hour")}</span><input type="number" min="0" max="23" value={form.hour} onChange={(e) => setForm({ ...form, hour: String(Math.max(0, Math.min(23, Number(e.target.value || 0)))).padStart(2, "0") })} /></label>
                  <b>:</b>
                  <label><span>{t("minute", "Minute")}</span><input type="number" min="0" max="59" value={form.minute} onChange={(e) => setForm({ ...form, minute: String(Math.max(0, Math.min(59, Number(e.target.value || 0)))).padStart(2, "0") })} /></label>
                  <b>:</b>
                  <label><span>{t("second", "Second")}</span><input type="number" min="0" max="59" value={form.second} onChange={(e) => setForm({ ...form, second: String(Math.max(0, Math.min(59, Number(e.target.value || 0)))).padStart(2, "0") })} /></label>
                </div>
              </fieldset>
              <label className="field"><span>{t("category", "Category")}</span>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option>Bills</option><option>Groceries</option><option>Shopping</option><option>Food & Dining</option>
                  <option>Rent</option><option>Subscription</option><option>School</option><option>Transport</option>
                  <option>Appointment</option><option>Family</option><option>Birthday</option><option>Work</option><option>Other</option>
                </select>
              </label>
              <label className="field"><span>{t("remindMe", "Remind me")}</span>
                <select value={form.remindBeforeMinutes} onChange={(e) => setForm({ ...form, remindBeforeMinutes: e.target.value })}>
                  <option value="0">At event time</option>
                  <option value="5">5 minutes before</option>
                  <option value="10">10 minutes before</option>
                  <option value="30">30 minutes before</option>
                  <option value="60">1 hour before</option>
                  <option value="1440">1 day before</option>
                </select>
              </label>
              <label className="field"><span>{t("repeat", "Repeat")}</span>
                <select value={form.repeat} onChange={(e) => setForm({ ...form, repeat: e.target.value })}>
                  <option value="NONE">{t("never", "Never")}</option>
                  <option value="DAILY">{t("daily", "Daily")}</option>
                  <option value="WEEKLY">{t("weekly", "Weekly")}</option>
                  <option value="MONTHLY">{t("monthly", "Monthly")}</option>
                  <option value="YEARLY">{t("yearly", "Yearly")}</option>
                </select>
              </label>
              <p className="form-note"><Bell size={15} /> Keep the app open for sound alerts.</p>
              <div className="drawer-actions">
                <button className="btn ghost" type="button" onClick={() => setShowForm(false)}>{t("cancel", "Cancel")}</button>
                <button className="btn primary" type="submit" disabled={saving}><Plus size={17} /> {saving ? t("loading", "Loading…") : t("addReminder", "Add reminder")}</button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
