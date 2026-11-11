import axios from "axios";

import { INTERVIEW_STORAGE_KEY } from "../constants";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});



axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 from /login is a wrong password; let the page show the error.
    const isLoginRequest = error.config?.url === "/login";

    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem(INTERVIEW_STORAGE_KEY);
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default axiosClient;