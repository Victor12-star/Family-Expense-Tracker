import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, setTokens, clearTokens, getRefreshToken } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On load: try to restore the session using the stored refresh token
  useEffect(() => {
    const refreshToken = localStorage.getItem("fet_refresh");

    // If no refresh token, user is not logged in
    if (!refreshToken) {
      setLoading(false);
      return;
    }

    // Try to refresh the access token using the stored refresh token
    // This keeps the user signed in across page reloads
    async function restoreSession() {
      try {
        const { data } = await api.post("/auth/refresh", { refreshToken });
        setTokens(data);
        setUser(data.user);
      } catch (_) {
        // Refresh failed — clear tokens and sign out
        clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
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
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) await api.post("/auth/logout", { refreshToken });
    } catch (_) {
      // Always clear the local session, even if the server is temporarily unreachable.
    } finally {
      clearTokens();
      setUser(null);
    }
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