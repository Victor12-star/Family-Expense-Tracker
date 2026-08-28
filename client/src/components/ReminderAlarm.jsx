import { useEffect, useRef, useState } from "react";
import { AlarmClock, Square } from "lucide-react";
import { api } from "../api/client.js";
import { useFamily } from "../context/FamilyContext.jsx";
import { playReminderChime, unlockReminderAudio } from "../utils/reminderAudio.js";

const SOUND_KEY = "fet_reminder_sound";

function triggerTime(reminder) {
  const [year, month, day] = (reminder.date || "").slice(0, 10).split("-").map(Number);
  const [hour = 0, minute = 0, second = 0] = (reminder.time || "00:00:00").split(":").map(Number);
  if (![year, month, day, hour, minute, second].every(Number.isFinite)) return null;
  const eventTime = new Date(year, month - 1, day, hour, minute, second).getTime();
  return eventTime - Number(reminder.remindBeforeMinutes || 0) * 60_000;
}

export default function ReminderAlarm() {
  const { family, view } = useFamily();
  const [reminders, setReminders] = useState([]);
  const [activeReminder, setActiveReminder] = useState(null);
  const firedRef = useRef(new Set());
  const activeReminderRef = useRef(null);

  function stopAlarm() {
    activeReminderRef.current = null;
    setActiveReminder(null);
  }

  useEffect(() => {
    let active = true;
    async function load() {
      if (view === "family" && !family?.id) {
        if (active) setReminders([]);
        return;
      }
      try {
        const response = await api.get("/reminders", {
          params: { view, familyId: view === "family" ? family.id : undefined },
        });
        if (active) setReminders(Array.isArray(response.data) ? response.data : []);
      } catch (_) {
        // Authentication recovery and user-facing errors are handled centrally.
      }
    }

    load();
    const refreshTimer = window.setInterval(load, 20_000);
    window.addEventListener("fet:reminders-changed", load);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
      window.removeEventListener("fet:reminders-changed", load);
    };
  }, [family?.id, view]);

  useEffect(() => {
    async function unlock() {
      if (await unlockReminderAudio()) {
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
      }
    }
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (!activeReminder) return undefined;
    let active = true;
    const sound = activeReminder.sound || localStorage.getItem(SOUND_KEY) || "soft";

    async function ring() {
      if (active) await playReminderChime(sound);
    }

    ring();
    const ringTimer = window.setInterval(ring, 3_500);
    return () => {
      active = false;
      window.clearInterval(ringTimer);
    };
  }, [activeReminder]);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      const now = Date.now();
      for (const reminder of reminders) {
        const trigger = triggerTime(reminder);
        if (trigger == null) continue;
        const key = `${reminder.id}:${trigger}`;
        // A one-minute grace period handles background-tab timer throttling.
        if (now >= trigger && now - trigger <= 60_000 && !firedRef.current.has(key)) {
          if (activeReminderRef.current) continue;
          firedRef.current.add(key);
          activeReminderRef.current = reminder;
          setActiveReminder(reminder);
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(reminder.title, { body: `Reminder at ${reminder.time || "now"}` });
          }
        }
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [reminders]);

  if (!activeReminder) return null;

  return (
    <div className="reminder-alarm" role="alertdialog" aria-labelledby="reminder-alarm-title">
      <div className="reminder-alarm-icon" aria-hidden="true"><AlarmClock size={28} /></div>
      <div className="reminder-alarm-copy">
        <span>Reminder</span>
        <strong id="reminder-alarm-title">{activeReminder.title}</strong>
        <small>{activeReminder.time ? `Scheduled for ${activeReminder.time.slice(0, 5)}` : "Scheduled for now"}</small>
      </div>
      <button type="button" className="btn alarm-stop" onClick={stopAlarm} autoFocus>
        <Square size={16} fill="currentColor" aria-hidden="true" /> Stop alarm
      </button>
    </div>
  );
}
