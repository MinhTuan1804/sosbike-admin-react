import axios from "axios";
import { getAccessToken } from "../features/auth/authStorage";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
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
