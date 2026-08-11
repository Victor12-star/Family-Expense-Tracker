// =====================================================================
// Formatting helpers shared across the app
// =====================================================================
import { CURRENCIES, DEFAULT_CURRENCY } from "./constants.js";

// Get the symbol for a currency code (defaults to SEK's "kr")
export function currencySymbol(code) {
  return CURRENCIES[code] || CURRENCIES[DEFAULT_CURRENCY];
}

// Format a number as money with the given currency symbol
export function money(n, code = DEFAULT_CURRENCY) {
  const sym = currencySymbol(code);
  return sym + Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// Format an ISO date to a short friendly form, e.g. "Aug 5"
export function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

// Today's date as YYYY-MM-DD
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Current month as YYYY-MM
export function currentMonth() {
  return todayISO().slice(0, 7);
}

// Month name for a given offset
export function monthName(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleDateString([], { month: "long" });
}
