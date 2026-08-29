import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, setTokens, clearTokens, getRefreshToken, isSessionRejected, refreshSession } from "../api/client.js";

const AuthContext = createContext(null);
const USER_KEY = "fet_user";

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch (_) {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
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
        const data = await refreshSession();
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      } catch (error) {
        // Keep the locally restored session during temporary connection or
        // server-startup failures. A later API request can retry the refresh.
        if (isSessionRejected(error)) {
          clearTokens();
          setUser(null);
          localStorage.removeItem(USER_KEY);
        }
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
    localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
    return res.data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
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
      localStorage.removeItem(USER_KEY);
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
