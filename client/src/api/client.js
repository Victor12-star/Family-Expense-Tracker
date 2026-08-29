import axios from "axios";

// The backend API base URL.
const rawApiUrl = import.meta.env.VITE_API_URL || "";
const API_URL = rawApiUrl
  ? rawApiUrl.replace(/\/$/, "") + "/api"
  : "/api";

const api = axios.create({ baseURL: API_URL });

let accessToken = null;
let refreshToken = localStorage.getItem("fet_refresh");
let refreshPromise = null;

// Keep rotating refresh tokens synchronized between desktop/mobile browser
// tabs. Without this, two tabs can reuse the same token and one tab may
// incorrectly sign the user out after the other tab refreshes first.
window.addEventListener("storage", (event) => {
  if (event.key === "fet_refresh") refreshToken = event.newValue;
});

export function setTokens({ accessToken: at, refreshToken: rt }) {
  accessToken = at;
  refreshToken = rt;
  if (rt) localStorage.setItem("fet_refresh", rt);
}

export function getRefreshToken() {
  return refreshToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem("fet_refresh");
}

// Refresh-token rotation allows each token to be used only once. Reuse one
// in-flight request so simultaneous API 401 responses cannot rotate the same
// token multiple times and accidentally sign out a valid session.
export async function refreshSession() {
  if (!refreshPromise) {
    const rotateToken = async () => {
      // Re-read storage after acquiring the cross-tab lock so this request
      // always uses the newest token created by another open tab.
      refreshToken = localStorage.getItem("fet_refresh");
      if (!refreshToken) throw new Error("No refresh token available");
      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      setTokens(data);
      return data;
    };

    refreshPromise = (navigator.locks?.request
      ? navigator.locks.request("fet-session-refresh", rotateToken)
      : rotateToken())
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isRefreshRequest = original?.url?.includes("/auth/refresh");
    if (error.response?.status === 401 && !isRefreshRequest && !original._retry && refreshToken) {
      original._retry = true;
      try {
        const data = await refreshSession();
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        clearTokens();
        if (window.location.pathname !== "/login") window.location.replace("/login");
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export { api };
