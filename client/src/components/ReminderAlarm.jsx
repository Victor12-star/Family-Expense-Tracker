import { useEffect, useRef, useState } from "react";
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
  const firedRef = useRef(new Set());

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
    const timer = window.setInterval(async () => {
      const now = Date.now();
      for (const reminder of reminders) {
        const trigger = triggerTime(reminder);
        if (trigger == null) continue;
        const key = `${reminder.id}:${trigger}`;
        // A one-minute grace period handles background-tab timer throttling.
        if (now >= trigger && now - trigger <= 60_000 && !firedRef.current.has(key)) {
          firedRef.current.add(key);
          await playReminderChime(reminder.sound || localStorage.getItem(SOUND_KEY) || "soft");
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(reminder.title, { body: `Reminder at ${reminder.time || "now"}` });
          }
        }
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [reminders]);

  return null;
}
