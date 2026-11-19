import { beginBusy, isUserDriven } from "./loading";
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { BASE_URL } from "./baseUrl";
import { getCookie } from "../utils/cookies";
import { logout } from "../utils/auth";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getCookie("token");
    if (token) {
      config.headers = (config.headers ?? {}) as any;
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (isUserDriven(config.method)) (config as any).__endBusy = beginBusy();
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    (response.config as any)?.__endBusy?.();
    return response;
  },
  (error: AxiosError) => {
    (error.config as any)?.__endBusy?.();
    const status = error.response?.status;
    const body = error.response?.data as { maintenance?: boolean; readOnly?: boolean; message?: string } | undefined;
    if (status === 401) {
      logout();
    }
    // Server is in a blocking maintenance window: tell the page (the banner component shows it).
    if (status === 503 && body?.maintenance) {
      window.dispatchEvent(new CustomEvent("yare:maintenance", { detail: body }));
    }
    // View-only student: the server's wording is already neutral, surface it as-is.
    if (status === 403 && body?.readOnly) {
      window.dispatchEvent(new CustomEvent("yare:read-only", { detail: body }));
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
