import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

export const isNativeApp = Capacitor.isNativePlatform();

function notificationId(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash | 0) || 1;
}

export async function requestReminderPermission() {
  if (isNativeApp) {
    const current = await LocalNotifications.checkPermissions();
    if (current.display === "granted") return "granted";
    const requested = await LocalNotifications.requestPermissions();
    return requested.display;
  }
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "default") return Notification.requestPermission();
  return Notification.permission;
}

export async function scheduleNativeReminder(reminder) {
  if (!isNativeApp || !reminder?.id || !reminder?.date) return false;

  const permission = await requestReminderPermission();
  if (permission !== "granted") return false;

  const time = reminder.time || "09:00:00";
  const scheduledAt = new Date(`${String(reminder.date).slice(0, 10)}T${time}`);
  scheduledAt.setMinutes(scheduledAt.getMinutes() - Number(reminder.remindBeforeMinutes || 0));
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) return false;

  await LocalNotifications.schedule({
    notifications: [{
      id: notificationId(reminder.id),
      title: reminder.title,
      body: reminder.category ? `${reminder.category} reminder` : "Family Expense Tracker reminder",
      schedule: { at: scheduledAt, allowWhileIdle: true },
      extra: { reminderId: reminder.id },
    }],
  });
  return true;
}

export async function cancelNativeReminder(reminderId) {
  if (!isNativeApp || !reminderId) return;
  await LocalNotifications.cancel({ notifications: [{ id: notificationId(reminderId) }] });
}

export async function cancelNativeReminders(reminders = []) {
  if (!isNativeApp || reminders.length === 0) return;
  await LocalNotifications.cancel({
    notifications: reminders.map((reminder) => ({ id: notificationId(reminder.id) })),
  });
}
