import { create } from 'zustand'
import {
  getMiCuenta, getMiSaldo, getMisTarjetas,
  agregarTarjeta, eliminarTarjeta, verificarTarjeta,
  getHistorialRecargas, agregarRecarga,
  getMisMultas, pagarMultaConTarjeta, pagarMultaConSaldo,
} from '../api/userApi'

const useUserStore = create((set, get) => ({
  cuenta:            null,
  saldo:             null,
  tarjetas:          [],
  recargas:          [],
  multas:            [],
  tarjetasParaPagar: [],
  loadingCuenta:    false,
  loadingSaldo:     false,
  loadingTarjetas:  false,
  loadingRecargas:  false,
  loadingMultas:    false,
  loading:          false,
  lastRefresh:      null,

  getStats: () => {
    const { saldo, multas, tarjetas, recargas } = get()
    return {
      saldoStr:         saldo?.saldoActual || `Q${parseFloat(saldo?.saldo ?? saldo?.Saldo ?? 0).toFixed(2)}`,
      saldoNumerico:    saldo?.saldoNumerico ?? parseFloat(saldo?.saldoActual?.replace('Q','') ?? 0),
      multasPendientes: multas.filter(m => m.estado==='PENDIENTE').length,
      totalMultas:      multas.length,
      tarjetasActivas:  tarjetas.length,
      totalRecargas:    recargas.length,
    }
  },

  fetchAll: async () => {
    const s = get()
    await Promise.all([s.fetchCuenta(), s.fetchSaldo(), s.fetchTarjetas(), s.fetchMisMultas(), s.fetchRecargas()])
    set({ lastRefresh: new Date() })
  },

  fetchCuenta: async () => {
    set({ loadingCuenta: true })
    try {
      const { data } = await getMiCuenta()
      set({ cuenta: data.cuenta ?? data.data ?? data, loadingCuenta: false })
    } catch { set({ loadingCuenta: false }) }
  },

  fetchSaldo: async () => {
    set({ loadingSaldo: true })
    try {
      const { data } = await getMiSaldo()
      set({ saldo: data.cuenta ?? data.data ?? data, loadingSaldo: false })
    } catch { set({ loadingSaldo: false }) }
  },

  fetchTarjetas: async () => {
    set({ loadingTarjetas: true })
    try {
      const { data } = await getMisTarjetas()
      set({ tarjetas: data.tarjetas ?? data.data ?? [], loadingTarjetas: false })
    } catch { set({ loadingTarjetas: false }) }
  },

  agregarTarjeta: async (formData) => {
    set({ loading: true })
    try {
      const { data } = await agregarTarjeta(formData)
      set({ loading: false })
      return { ok: true, message: data.message || 'Revisa tu correo para verificar la tarjeta' }
    } catch (err) {
      set({ loading: false })
      return { ok: false, message: err.response?.data?.message || 'Error al agregar tarjeta' }
    }
  },

  eliminarTarjeta: async (id) => {
    set({ loading: true })
    try {
      await eliminarTarjeta(id)
      await get().fetchTarjetas()
      return { ok: true }
    } catch (err) {
      set({ loading: false })
      return { ok: false, message: err.response?.data?.message || 'Error al eliminar tarjeta' }
    }
  },

  verificarTarjeta: async (codigo) => {
    set({ loading: true })
    try {
      const { data } = await verificarTarjeta(codigo)
      await get().fetchTarjetas()
      return { ok: true, message: data.message }
    } catch (err) {
      set({ loading: false })
      return { ok: false, message: err.response?.data?.message || 'Código inválido' }
    }
  },

  fetchRecargas: async () => {
    set({ loadingRecargas: true })
    try {
      const { data } = await getHistorialRecargas()
      set({ recargas: data.recargas ?? data.data ?? [], loadingRecargas: false })
    } catch { set({ loadingRecargas: false }) }
  },

  agregarRecarga: async (tarjetaId, monto) => {
    set({ loading: true })
    try {
      const { data } = await agregarRecarga(tarjetaId, monto)
      await get().fetchSaldo()
      await get().fetchRecargas()
      return { ok: true, message: data.message }
    } catch (err) {
      set({ loading: false })
      return { ok: false, message: err.response?.data?.message || 'Error al recargar' }
    }
  },

  fetchMisMultas: async () => {
    set({ loadingMultas: true })
    try {
      const { data } = await getMisMultas()
      set({
        multas:            data.multas ?? data.data ?? [],
        tarjetasParaPagar: data.resumen?.tarjetasParaPagar ?? [],
        loadingMultas:     false,
      })
    } catch { set({ loadingMultas: false }) }
  },

  // Pagar con tarjeta de crédito
  pagarConTarjeta: async (multaId, tarjetaId) => {
    set({ loading: true })
    try {
      const { data } = await pagarMultaConTarjeta(multaId, tarjetaId)
      await get().fetchMisMultas()
      await get().fetchSaldo()
      return { ok: true, message: data.message, recibo: data.recibo }
    } catch (err) {
      set({ loading: false })
      return { ok: false, message: err.response?.data?.message || 'Error al pagar multa' }
    }
  },

  // Pagar con saldo de la cuenta
  pagarConSaldo: async (multaId) => {
    set({ loading: true })
    try {
      const { data } = await pagarMultaConSaldo(multaId)
      await get().fetchMisMultas()
      await get().fetchSaldo()
      return { ok: true, message: data.message, recibo: data.recibo }
    } catch (err) {
      set({ loading: false })
      return { ok: false, message: err.response?.data?.message || 'Error al pagar multa' }
    }
  },
}))

export default useUserStore