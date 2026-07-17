import axios from "axios";
import { getAccessToken } from "../features/auth/authStorage";

const resolvedBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || "https://api.sosbike.io.vn/api";

export const http = axios.create({
  baseURL: resolvedBaseUrl
});

http.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  config.headers["ngrok-skip-browser-warning"] = "true";

  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
