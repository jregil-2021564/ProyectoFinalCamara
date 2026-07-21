// src/shared/utils/pickArray.js
// La forma exacta en la que el backend envuelve las listas (data, items,
// multas, tarjetas, etc.) no está documentada, así que esta función prueba
// varias formas comunes y, si no encuentra un array en ninguna, devuelve []
// en vez de dejar pasar un objeto que rompería un .map()/.filter() más adelante.
export const pickArray = (payload) => {
  if (Array.isArray(payload)) return payload;

  const candidates = [
    payload?.data,
    payload?.data?.data,
    payload?.items,
    payload?.results,
    payload?.multas,
    payload?.misMultas,
    payload?.tarjetas,
    payload?.recargas,
    payload?.historial,
    payload?.historialRecargas,
    payload?.ultimasRecargas,
    payload?.movimientos,
    payload?.transacciones,
    payload?.cards,
    payload?.fines,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
};