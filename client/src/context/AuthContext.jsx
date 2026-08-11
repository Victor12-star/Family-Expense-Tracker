// =====================================================================
// AuthContext — manages login state and token storage
// =====================================================================
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, setTokens, clearTokens } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    setTokens(res.data);
    setUser(res.data.user);
    return res.data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    setTokens(res.data);
    setUser(res.data.user);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch (_) {}
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
