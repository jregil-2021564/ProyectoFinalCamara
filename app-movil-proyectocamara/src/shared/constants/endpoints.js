// src/shared/constants/endpoints.js

const AUTH_BASE = process.env.EXPO_PUBLIC_AUTH_URL || "http://localhost:3005/api/v1";

// ms-core (saldo/cuenta/pagos/trafico) corre en un servicio aparte.
const CORE_BASE = process.env.EXPO_PUBLIC_USER_URL || "http://localhost:3006/api/v1";

export const ENDPOINTS = {
  AUTH: {
    BASE: `${AUTH_BASE}/auth`,
    REGISTER: `${AUTH_BASE}/auth/register`,
    LOGIN: `${AUTH_BASE}/auth/login`,
    VERIFY_EMAIL: `${AUTH_BASE}/auth/verify-email`,
    RESEND_VERIFICATION: `${AUTH_BASE}/auth/resend-verification`,
    FORGOT_PASSWORD: `${AUTH_BASE}/auth/forgot-password`,
    RESET_PASSWORD: `${AUTH_BASE}/auth/reset-password`,
    REFRESH: `${AUTH_BASE}/auth/refresh`,
    PROFILE: `${AUTH_BASE}/auth/profile`,
  },
  CUENTA: {
    BASE: CORE_BASE,
    MI_CUENTA: `${CORE_BASE}/cuenta/mi-cuenta`,
  },
  SALDO: {
    MI_SALDO: `${CORE_BASE}/saldo/mi-saldo`,
    HISTORIAL: `${CORE_BASE}/saldo/historial`,
    RECARGAR: `${CORE_BASE}/saldo/recargar`,
    MIS_TARJETAS: `${CORE_BASE}/saldo/mis-tarjetas`,
    AGREGAR_TARJETA: `${CORE_BASE}/saldo/agregar-tarjeta`,
    VERIFICAR_TARJETA: `${CORE_BASE}/saldo/verificar-tarjeta`,
    ELIMINAR_TARJETA: (id) => `${CORE_BASE}/saldo/mis-tarjetas/${id}`,
  },
  PAGOS: {
    MIS_MULTAS: `${CORE_BASE}/pagos/mis-multas`,
    PAGAR_MULTA: `${CORE_BASE}/pagos/pagar-multa`,
  },
  TRAFICO: {
    AUMENTAR_MULTAS: `${CORE_BASE}/trafico/aumentar-multas`,
  },
};

// Rutas de auth que NO requieren Authorization/refresh. Son relativas porque
// authClient.js sigue usando baseURL (ENDPOINTS.AUTH.BASE) + path relativo.
export const AUTH_PATHS = {
  REGISTER: "/register",
  LOGIN: "/login",
  REFRESH: "/refresh",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
  RESEND_VERIFICATION: "/resend-verification",
};