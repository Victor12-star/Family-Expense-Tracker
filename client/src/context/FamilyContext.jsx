import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api/client.js";

const FamilyContext = createContext(null);
const VIEW_KEY = "fet_view";

export function FamilyProvider({ children }) {
  const [family, setFamily] = useState(null);
  const [familyLoading, setFamilyLoading] = useState(true);
  const [view, setViewState] = useState(() => {
    const saved = localStorage.getItem(VIEW_KEY);
    return saved === "single" ? "single" : "family";
  });

  const setView = useCallback((nextView) => {
    const normalized = nextView === "single" ? "single" : "family";
    setViewState(normalized);
    localStorage.setItem(VIEW_KEY, normalized);
  }, []);

  const loadFamily = useCallback(async (familyId) => {
    const res = await api.get(`/families/${familyId}`);
    setFamily(res.data);
    return res.data;
  }, []);

  const refreshFamilies = useCallback(async () => {
    try {
      const res = await api.get("/families/me");
      const families = Array.isArray(res.data) ? res.data : [];
      setFamily((current) => {
        if (current) {
          const stillAvailable = families.find((item) => item.id === current.id);
          if (stillAvailable) return stillAvailable;
        }
        return families[0] || null;
      });
      return families;
    } catch (_) {
      setFamily(null);
      return [];
    } finally {
      setFamilyLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFamilies();
  }, [refreshFamilies]);

  return (
    <FamilyContext.Provider
      value={{
        family,
        setFamily,
        familyLoading,
        loadFamily,
        refreshFamilies,
        view,
        setView,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
