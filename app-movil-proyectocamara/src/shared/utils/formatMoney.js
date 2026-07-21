// src/shared/utils/formatMoney.js
// A prueba de que el backend a veces devuelve el monto ya formateado como
// string ("Q200.00") y otras veces como número crudo (200). Si intentamos
// Number("Q200.00") da NaN — por eso "QNaN". Esta función detecta cuál es.
export const formatMoney = (value) => {
  if (typeof value === "string" && value.trim().startsWith("Q")) {
    return value;
  }
  const num = typeof value === "number" ? value : parseFloat(value);
  return `Q${Number.isFinite(num) ? num.toFixed(2) : "0.00"}`;
};

// Convierte cualquier forma de monto ("Q43700.00", 43700, "43700") a un
// número real, para poder comparar (ej. "¿alcanza el saldo?").
export const parseMoneyNumber = (value) => {
  if (typeof value === "number") return value;
  const num = parseFloat(String(value ?? "0").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(num) ? num : 0;
};