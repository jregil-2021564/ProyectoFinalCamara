// src/features/consultas/data/serviciosData.js
export const SERVICE_TYPES = [
  {
    key: "luz",
    label: "Luz",
    icon: "lightbulb",
    color: "#D9A017",
    inputLabel: "Número de contador / NIS",
    hasPackages: false,
  },
  {
    key: "agua",
    label: "Agua",
    icon: "water-drop",
    color: "#2E86D9",
    inputLabel: "Número de cliente",
    hasPackages: false,
  },
  {
    key: "internet",
    label: "Internet",
    icon: "wifi",
    color: "#0EA5A5",
    inputLabel: "Número de teléfono",
    hasPackages: true,
  },
  {
    key: "saldo",
    label: "Saldo",
    icon: "sim-card",
    color: "#2FAE5C",
    inputLabel: "Número de teléfono",
    hasPackages: true,
  },
];

// Paquetes de referencia, inspirados en el diseño de Claro que mandaste.
export const PACKAGES_BY_SERVICE = {
  internet: [
    { key: "i17", title: "Todo Incluido 17GB", price: 120, days: 30 },
    { key: "i10", title: "Todo Incluido 10GB", price: 65, days: 15 },
    { key: "i7", title: "Internet 7GB", price: 35, days: 7 },
    { key: "i1_5", title: "Todo Incluido 1.5GB", price: 10, days: 1 },
  ],
  saldo: [
    { key: "s10", title: "Recarga de saldo", price: 10, days: null },
    { key: "s20", title: "Recarga de saldo", price: 20, days: null },
    { key: "s50", title: "Recarga de saldo", price: 50, days: null },
    { key: "s100", title: "Recarga de saldo", price: 100, days: null },
  ],
};