// src/shared/store/authStore.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const REFRESH_TOKEN_KEY = "app_movil_proyectocamara_refresh_token";

// expo-secure-store no está soportado en web, así que en esa plataforma
// se usa localStorage como fallback. En Android/iOS se usa SecureStore.
const setRefreshToken = async (value) => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.setItem(REFRESH_TOKEN_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, value);
};

const deleteRefreshToken = async () => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {});
};

export const getRefreshToken = async () => {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") return window.localStorage.getItem(REFRESH_TOKEN_KEY);
    return null;
  }
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

// --- Roles ---
// El backend usa roleName "ADMIN_ROLE" / "USER_ROLE" (ver endpoint
// "Asignar Rol Admin/User" del Postman). El shape exacto del user que
// devuelve /login no está documentado en el Postman, así que se toleran
// varias formas posibles: user.role, user.roleName o user.roles[0].
export const ADMIN_ROLE = "ADMIN_ROLE";
export const USER_ROLE = "USER_ROLE";

export const getUserRole = (user) =>
  user?.role || user?.roleName || (Array.isArray(user?.roles) && user.roles[0]) || null;

export const isAdminUser = (user) => getUserRole(user) === ADMIN_ROLE;

export const authStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,

      // Caché LOCAL (en este dispositivo) de los datos que la persona
      // escribió al registrarse: { [username]: { name, surname, email,
      // phone, placa } }. Existe porque /login solo devuelve
      // { id, username, profilePicture, role } — no hay endpoint "mi
      // perfil" todavía. En cuanto exista, reemplazar por ese fetch real.
      registeredProfiles: {},

      // login(accessToken, user, refreshToken)
      login: async (accessToken, user, refreshToken) => {
        if (refreshToken) {
          await setRefreshToken(refreshToken);
        }
        set({ token: accessToken, user, isAuthenticated: true });
      },

      logout: async () => {
        await deleteRefreshToken();
        set({ token: null, user: null, isAuthenticated: false });
      },

      setAccessToken: (accessToken) => set({ token: accessToken }),

      updateUser: (partialUser) =>
        set((state) => ({ user: { ...state.user, ...partialUser } })),

      saveRegisteredProfile: (username, profile) => {
        if (!username) return;
        set((state) => ({
          registeredProfiles: {
            ...state.registeredProfiles,
            [username.toLowerCase()]: profile,
          },
        }));
      },

      getRegisteredProfile: (username) => {
        if (!username) return null;
        return get().registeredProfiles[username.toLowerCase()] || null;
      },

      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // El refresh token NUNCA se persiste aquí, vive solo en SecureStore/localStorage
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        registeredProfiles: state.registeredProfiles,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
