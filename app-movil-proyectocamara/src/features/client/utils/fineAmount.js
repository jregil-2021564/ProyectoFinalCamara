// src/features/client/utils/fineAmount.js
// Seguimos sin confirmar el nombre real del campo de monto en /pagos/mis-multas.
// Esta función prueba primero los nombres más probables, y si ninguno existe,
// escanea TODAS las llaves del objeto buscando algo que "suene" a dinero.
const DIRECT_KEYS = [
  "montoMulta",
  "monto",
  "Monto",
  "montoActual",
  "valor",
  "importe",
  "cantidad",
  "precio",
  "total",
  "amount",
  "cost",
  "fee",
];

const PATTERNS = ["monto", "valor", "importe", "cantidad", "precio", "total", "amount", "cost", "fee"];

export const getFineAmount = (fine) => {
  if (!fine || typeof fine !== "object") return 0;

  for (const key of DIRECT_KEYS) {
    if (fine[key] !== undefined && fine[key] !== null && fine[key] !== "") {
      return fine[key];
    }
  }

  for (const [key, value] of Object.entries(fine)) {
    const lower = key.toLowerCase();
    if (PATTERNS.some((p) => lower.includes(p))) {
      if (typeof value === "number" || (typeof value === "string" && /\d/.test(value))) {
        return value;
      }
    }
  }

  return 0;
};

// Campo real confirmado en /pagos/mis-multas: "tipoInfraccion"
// (ej. "Semáforo en rojo + Exceso de velocidad 95 km/h").
export const getFineDescription = (fine) => {
  if (!fine) return "Multa";
  return fine.tipoInfraccion || fine.descripcion || fine.motivo || "Multa";
};
