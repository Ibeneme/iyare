import axios from "axios";
import { BASE_URL } from "./baseurl";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// =======================
// 🔐 ADD TOKEN AUTOMATICALLY
// =======================
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("token");

    console.log(token, 'token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        "API Request ->",
        config.method?.toUpperCase(),
        config.url,
        config.data
      );
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "API Response <-",
        response.status,
        response.config.url,
        response.data
      );
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;

    if (status >= 500) {
      console.error("Server error:", error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;