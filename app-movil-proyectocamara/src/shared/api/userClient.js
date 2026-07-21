// src/shared/api/userClient.js
import axios from "axios";
import { ENDPOINTS } from "../constants/endpoints";
import { authStore, getRefreshToken } from "../store/authStore";

// userClient apunta a ms-core (saldo/cuenta/pagos/trafico, puerto 3006),
// pero el refresh SIEMPRE se hace contra ms-auth (ENDPOINTS.AUTH.REFRESH).
const userClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_USER_URL || "http://localhost:3006/api/v1",
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

userClient.interceptors.request.use((config) => {
  const token = authStore.getState().token;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

userClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return userClient(originalRequest);
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
        return userClient(originalRequest);
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

export default userClient;