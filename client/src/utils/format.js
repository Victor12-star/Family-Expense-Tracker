import { CURRENCIES, DEFAULT_CURRENCY } from "./constants.js";

export function currencySymbol(code) {
  return CURRENCIES[code] || CURRENCIES[DEFAULT_CURRENCY];
}

export function money(value, code = DEFAULT_CURRENCY, options = {}) {
  const amount = Number(value || 0);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: options.minimumFractionDigits ?? 0,
      maximumFractionDigits: options.maximumFractionDigits ?? 2,
    }).format(amount);
  } catch (_) {
    return `${currencySymbol(code)}${amount.toLocaleString(undefined, {
      maximumFractionDigits: options.maximumFractionDigits ?? 2,
    })}`;
  }
}

export function fmtDate(iso, options = { month: "short", day: "numeric" }) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], options);
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function currentMonth() {
  return todayISO().slice(0, 7);
}

export function monthName(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleDateString([], { month: "long" });
}

// The current backend still calls personal mode "individual". Keep the
// translation in one place until the database workspace migration is complete.
export function apiView(view) {
  return view === "single" ? "individual" : "family";
}
