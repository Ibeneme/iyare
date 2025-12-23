import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { BASE_URL } from "./baseurl";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ============================
   REQUEST INTERCEPTOR
============================ */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");

    if (token) {
      // Ensure headers object exists before setting Authorization
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);


axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status) {
      if (status === 401) {
        // --- ADDED: Specific 401 handling ---
        console.log("401 Unauthorized: Session expired or invalid token.");
        // Optional: Clear token and redirect to login page here.
        localStorage.removeItem("token");
        window.location.href = "/auth-sign-in";
      } else if (status >= 500) {
        // Server Error handling
        console.error("Server error:", error.response?.data);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;