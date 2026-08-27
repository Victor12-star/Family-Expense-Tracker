import axios from "axios";

// The backend API base URL.
const rawApiUrl = import.meta.env.VITE_API_URL || "";
const API_URL = rawApiUrl
  ? rawApiUrl.replace(/\/$/, "") + "/api"
  : "/api";

const api = axios.create({ baseURL: API_URL });

let accessToken = null;
let refreshToken = localStorage.getItem("fet_refresh");

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

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

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