// Pure financial helpers live outside database services so their rounding and
// validation rules can be tested without connecting to production data.

export function shoppingLineEstimate(item) {
  const quantity = Number(item?.quantity ?? 1);
  const unitPrice = Number(item?.estimatedUnitPrice ?? 0);

  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  if (!Number.isFinite(unitPrice) || unitPrice < 0) return 0;
  return quantity * unitPrice;
}

export function normalizeCurrency(value, fallback = "SEK") {
  const currency = String(value || fallback).trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : fallback;
}
