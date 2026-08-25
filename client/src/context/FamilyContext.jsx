// =====================================================================
// FamilyContext — current family, view (Family/Individual), members
// =====================================================================
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../api/client.js";

const FamilyContext = createContext(null);

export function FamilyProvider({ children }) {
  const [family, setFamily] = useState(null);   // current family object
  const [view, setView] = useState("family");   // "family" | "individual"

  // Auto-restore the user's family when the app loads (after a refresh,
  // crash, or navigation). This keeps the user connected to their family so
  // they NEVER have to re-enter an invite code just because the page reloaded.
  useEffect(() => {
    let cancelled = false;

    // Restore the current family object from cache instantly (no waiting).
    const cached = localStorage.getItem("fet_family");
    if (cached) {
      try {
        const obj = JSON.parse(cached);
        if (obj?.id) setFamily(obj);
      } catch (_) { /* ignore bad cache */ }
    }

    // Then verify/refresh against the server so the list is current.
    (async () => {
      try {
        const { data } = await api.get("/families/me");
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) {
          setFamily(data[0]);
          localStorage.setItem("fet_family", JSON.stringify(data[0]));
        }
      } catch (_) {
        // Not authenticated or no family yet — Family page handles it.
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const loadFamily = useCallback(async (familyId) => {
    const res = await api.get(`/families/${familyId}`);
    setFamily(res.data);
    localStorage.setItem("fet_family", JSON.stringify(res.data));
    return res.data;
  }, []);

  // Keep the cache in sync whenever the family is set directly.
  const persistFamily = useCallback((fam) => {
    setFamily(fam);
    if (fam?.id) localStorage.setItem("fet_family", JSON.stringify(fam));
    else localStorage.removeItem("fet_family");
  }, []);

  return (
    <FamilyContext.Provider value={{ family, setFamily: persistFamily, loadFamily, view, setView }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
