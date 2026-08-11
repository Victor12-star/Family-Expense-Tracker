// =====================================================================
// CurrencyContext — the user's preferred currency, persisted in localStorage
// =====================================================================
import { createContext, useContext, useState, useCallback } from "react";
import { DEFAULT_CURRENCY } from "../utils/constants.js";

const CurrencyContext = createContext(null);
const STORAGE_KEY = "fet_currency";

export function CurrencyProvider({ children }) {
  // Load saved currency (or default)
  const [currency, setCurrency] = useState(
    () => localStorage.getItem(STORAGE_KEY) || DEFAULT_CURRENCY
  );

  const changeCurrency = useCallback((code) => {
    setCurrency(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, changeCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
