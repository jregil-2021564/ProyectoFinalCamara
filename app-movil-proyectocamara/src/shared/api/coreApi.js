// src/shared/api/coreApi.js
// userClient.baseURL = EXPO_PUBLIC_USER_URL = http://localhost:3006/api/v1
// Todas las rutas de aquí son RELATIVAS a esa base.
import userClient from "./userClient.js";

// ─── Cuenta ───────────────────────────────────────────────────────────────
export const cuentaAPI = {
  miCuenta: () => userClient.get("/cuenta/mi-cuenta"),
};

// ─── Saldo ────────────────────────────────────────────────────────────────
export const saldoAPI = {
  miSaldo: () => userClient.get("/saldo/mi-saldo"),
  historial: () => userClient.get("/saldo/historial"),
  recargar: ({ tarjetaId, monto }) =>
    userClient.post("/saldo/recargar", { tarjetaId, monto: Number(monto) }),
};

// ─── Tarjetas ─────────────────────────────────────────────────────────────
export const tarjetasAPI = {
  list: () => userClient.get("/saldo/mis-tarjetas"),
  create: (data) => userClient.post("/saldo/agregar-tarjeta", data),
  delete: (id) => userClient.delete(`/saldo/mis-tarjetas/${id}`),
  verify: (token) => userClient.post("/saldo/verificar-tarjeta", { token }),
};

// ─── Pagos / Multas ───────────────────────────────────────────────────────
export const pagosAPI = {
  misMultas: () => userClient.get("/pagos/mis-multas"),
  pagarMulta: ({ multaId, tarjetaId }) =>
    userClient.post("/pagos/pagar-multa", { multaId, tarjetaId }),
};

// ─── Tráfico ──────────────────────────────────────────────────────────────
// aumentarMultas: PUT sin body, ver nota en useClientApi.js, no está
// conectado a ningún botón de la UI (parece un proceso interno).
export const traficoAPI = {
  aumentarMultas: () => userClient.put("/trafico/aumentar-multas"),
  // Pagar una multa usando el saldo de la cuenta (sin tarjeta).
  pagarConSaldo: (multaId) => userClient.post(`/trafico/pagar/${multaId}`),
};
