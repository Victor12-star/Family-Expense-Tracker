// =====================================================================
// API client — connects the frontend to the backend
// Uses the deployed backend URL in production, or localhost in dev.
// =====================================================================
import axios from "axios";

// The backend API base URL.
// - In production (Vercel/Netlify), use the deployed Render URL.
// - In development, the Vite proxy handles "/api" to localhost:5000.
const API_URL = import.meta.env.VITE_API_URL || "/api";

// Create an axios instance with the API base URL
const api = axios.create({ baseURL: API_URL });

// ---- Token storage (in memory for access, localStorage for refresh) ----
let accessToken = null;
let refreshToken = localStorage.getItem("fet_refresh");

// Save tokens after login/register/refresh
export function setTokens({ accessToken: at, refreshToken: rt }) {
  accessToken = at;
  refreshToken = rt;
  if (rt) localStorage.setItem("fet_refresh", rt);
}

// Clear tokens on logout
export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem("fet_refresh");
}

// Attach the access token to every request
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Handle 401 responses by trying to refresh the token
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && refreshToken) {
      original._retry = true;
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        setTokens(data);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        clearTokens();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export { api };
