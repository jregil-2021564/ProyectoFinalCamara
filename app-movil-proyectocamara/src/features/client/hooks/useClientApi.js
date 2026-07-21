// src/features/client/hooks/useClientApi.js
import { useCallback, useState } from "react";
import { cuentaAPI, saldoAPI, tarjetasAPI, pagosAPI, traficoAPI } from "../../../shared/api/coreApi";

const extractErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.message ||
  "Ocurrió un error inesperado. Intenta de nuevo.";

// Hook con el mismo shape público de siempre (getAccount, getBalance,
// etc.), pero por dentro ahora delega en coreApi.js (llamadas agrupadas por
// entidad: cuentaAPI, saldoAPI, tarjetasAPI, pagosAPI). Las pantallas no
// necesitan cambiar nada.
export const useClientApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (requestFn) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await requestFn();
      return { success: true, data };
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getAccount = useCallback(() => run(() => cuentaAPI.miCuenta()), [run]);
  const getBalance = useCallback(() => run(() => saldoAPI.miSaldo()), [run]);
  const getRechargeHistory = useCallback(() => run(() => saldoAPI.historial()), [run]);
  const recharge = useCallback((data) => run(() => saldoAPI.recargar(data)), [run]);

  const getCards = useCallback(() => run(() => tarjetasAPI.list()), [run]);
  const addCard = useCallback((card) => run(() => tarjetasAPI.create(card)), [run]);
  const deleteCard = useCallback((id) => run(() => tarjetasAPI.delete(id)), [run]);
  const verifyCard = useCallback((token) => run(() => tarjetasAPI.verify(token)), [run]);

  const getFines = useCallback(() => run(() => pagosAPI.misMultas()), [run]);
  const payFine = useCallback((data) => run(() => pagosAPI.pagarMulta(data)), [run]);
  const payFineWithBalance = useCallback(
    (multaId) => run(() => traficoAPI.pagarConSaldo(multaId)),
    [run]
  );

  return {
    loading,
    error,
    getAccount,
    getBalance,
    getRechargeHistory,
    recharge,
    getCards,
    addCard,
    deleteCard,
    verifyCard,
    getFines,
    payFine,
    payFineWithBalance,
  };
};
