// src/shared/api/authClient.js
import axios from "axios";
import { ENDPOINTS, AUTH_PATHS } from "../constants/endpoints";
import { authStore, getRefreshToken } from "../store/authStore";

const NO_REFRESH_PATHS = Object.values(AUTH_PATHS).filter(
  (path) => path !== AUTH_PATHS.REFRESH
);

const authClient = axios.create({
  baseURL: ENDPOINTS.AUTH.BASE,
  timeout: 15000,
  headers: { Accept: "application/json" },
});

let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
};

const isExemptPath = (url = "") => NO_REFRESH_PATHS.some((path) => url.includes(path));

authClient.interceptors.request.use((config) => {
  const token = authStore.getState().token;
  if (token && !isExemptPath(config.url)) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

authClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (!originalRequest || isExemptPath(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return authClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error("Sin refresh token disponible");

        const { data } = await axios.post(ENDPOINTS.AUTH.REFRESH, {
          refreshToken,
        });

        const newAccessToken = data?.accessToken || data?.token;
        if (!newAccessToken) throw new Error("Respuesta de refresh inválida");

        authStore.getState().setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return authClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await authStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default authClient;