// =====================================================================
// App-wide constants
// =====================================================================

// Expense categories + their colors (aligned with the design system)
export const CATEGORIES = {
  Food: "#f59e0b",            // amber
  Transport: "#6366f1",       // indigo
  Shopping: "#0d9488",        // teal
  Bills: "#dc2626",           // red (fixed bills)
  Entertainment: "#d946ef",   // fuchsia
  Health: "#16a34a",          // green
  Other: "#94a3b8",           // slate
};

// Full list of world currencies (code -> symbol)
export const CURRENCIES = {
  SEK: "kr",
  USD: "$",
  EUR: "€",
  GBP: "£",
  NGN: "₦",
  JPY: "¥",
  CAD: "$",
  AUD: "$",
  CNY: "¥",
  INR: "₹",
  CHF: "Fr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  BRL: "R$",
  MXN: "$",
  ZAR: "R",
  KRW: "₩",
  RUB: "₽",
  TRY: "₺",
};

// List of currency codes for dropdowns (in order)
export const CURRENCY_CODES = Object.keys(CURRENCIES);

// Default currency
export const DEFAULT_CURRENCY = "SEK";

// Family roles
export const ROLES = ["OWNER", "ADMIN", "MEMBER"];
