// =====================================================================
// FamilyContext — current family, view (Family/Individual), members
// =====================================================================
import { createContext, useContext, useState, useCallback } from "react";
import { api } from "../api/client.js";

const FamilyContext = createContext(null);

export function FamilyProvider({ children }) {
  const [family, setFamily] = useState(null);   // current family object
  const [view, setView] = useState("family");   // "family" | "individual"

  const loadFamily = useCallback(async (familyId) => {
    const res = await api.get(`/families/${familyId}`);
    setFamily(res.data);
    return res.data;
  }, []);

  return (
    <FamilyContext.Provider value={{ family, setFamily, loadFamily, view, setView }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
