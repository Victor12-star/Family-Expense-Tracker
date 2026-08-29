import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { api } from "../api/client.js";
import { useAuth } from "./AuthContext.jsx";

const FamilyContext = createContext(null);
const VIEW_KEY = "fet_view";

export function FamilyProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [family, setFamily] = useState(null);
  const [familyLoading, setFamilyLoading] = useState(true);
  const familyRequestRef = useRef(0);
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

  const refreshFamilies = useCallback(async (expectedUserId = user?.id) => {
    const requestId = ++familyRequestRef.current;
    try {
      const res = await api.get("/families/me");
      const families = Array.isArray(res.data) ? res.data : [];
      const verifiedFamilies = expectedUserId
        ? families.filter((item) => item.members?.some((member) => member.userId === expectedUserId))
        : [];

      // Ignore a response started for an older login session.
      if (requestId !== familyRequestRef.current) return [];
      setFamily((current) => {
        if (current) {
          const stillAvailable = verifiedFamilies.find((item) => item.id === current.id);
          if (stillAvailable) return stillAvailable;
        }
        return verifiedFamilies[0] || null;
      });
      return verifiedFamilies;
    } catch (_) {
      if (requestId === familyRequestRef.current) setFamily(null);
      return [];
    } finally {
      if (requestId === familyRequestRef.current) setFamilyLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      familyRequestRef.current += 1;
      setFamily(null);
      setFamilyLoading(false);
      return;
    }
    // Do not expose a family from the previous session while the new
    // account's membership is being resolved.
    setFamily(null);
    setFamilyLoading(true);
    refreshFamilies(user.id);
  }, [authLoading, user?.id, refreshFamilies]);

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
