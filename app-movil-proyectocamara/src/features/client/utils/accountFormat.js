// src/features/client/utils/accountFormat.js
// Misma lógica de normalización que CuentaCard.jsx del frontend web: el
// backend puede devolver los campos con distintos nombres/formas según el
// endpoint, así que probamos varias rutas posibles en orden.

export const getNumeroCuenta = (account) =>
  account?.numeroCuenta || account?.NumeroCuenta || "—";

export const getTitular = (account) =>
  account?.titular ||
  `${account?.User?.Name || ""} ${account?.User?.Surname || ""}`.trim() ||
  "—";

export const getEmail = (account) => account?.email || account?.User?.Email || "—";

export const getPlaca = (account, balance) =>
  account?.placa || account?.UserProfile?.Placa || balance?.placa || "—";

// saldoStr: string ya formateado tipo "Q123.45" si el backend lo manda así;
// si no, lo armamos nosotros a partir del número crudo (varios nombres
// posibles: saldo, Saldo, o el saldo embebido en la cuenta).
export const getSaldoStr = (balance, account) =>
  balance?.saldoActual ||
  `Q${Number(balance?.saldo ?? balance?.Saldo ?? account?.saldo ?? 0).toFixed(2)}`;

export const getSaldoNumerico = (balance) =>
  balance?.saldoNumerico ??
  parseFloat(String(balance?.saldoActual || "").replace("Q", "")) ??
  0;

export const getPuedesPagar = (balance) => {
  const saldoNum = getSaldoNumerico(balance);
  return balance?.puedesPagar ?? saldoNum > 0;
};