// =====================================================================
// App-wide constants
// =====================================================================

// Expense categories + their colors
export const CATEGORIES = {
  Food: "#f59e0b",
  Transport: "#38bdf8",
  Shopping: "#a78bfa",
  Bills: "#fbbf24",
  Entertainment: "#f472b6",
  Health: "#34d399",
  Other: "#94a3b8",
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
