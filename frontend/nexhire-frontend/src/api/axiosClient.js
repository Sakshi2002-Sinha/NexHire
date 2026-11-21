import axios from "axios";

export const TOKEN_KEY = "token";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 90_000,
});

// One place attaches the token, so no API call has to remember it.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 from the login form means wrong credentials, not an expired session.
    const isLogin = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLogin) {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.clear();
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  // FastAPI validation errors arrive as a list.
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg.replace(/^Value error, /, "");
  if (error?.code === "ECONNABORTED") return "The request timed out. Please try again.";
  if (error?.request && !error?.response) return "Cannot reach the server. Check your connection.";
  return fallback;
}

export default axiosClient;
