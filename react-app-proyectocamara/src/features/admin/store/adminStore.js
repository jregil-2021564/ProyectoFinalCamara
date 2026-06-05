import { create } from 'zustand'
import {
  getUsers, assignRole, removeRole,
  getMultas, getMultasPorPlaca, actualizarMulta, aumentarMultas, registrarInfraccion,
  getVehiculos, registrarVehiculo,
  iniciarCamara,
} from '../api/adminApi'

const useAdminStore = create((set, get) => ({
  users:         [],
  multas:        [],
  vehiculos:     [],
  camaraActiva:  false,
  loading:       false,
  loadingMultas: false,
  loadingUsers:  false,
  loadingVehiculos: false,
  loadingCamara: false,
  error:         null,

  // ── Stats derivados ──────────────────────────────────────────
  getStats: () => {
    const { multas, users } = get()
    return {
      totalUsuarios:   users.length,
      totalMultas:     multas.length,
      multasPendientes: multas.filter(m => m.estado === 'PENDIENTE').length,
      multasPagadas:   multas.filter(m => m.estado === 'PAGADA').length,
      montoTotal:      multas.reduce((s,m) => s + parseFloat(m.monto_multa||0), 0),
      montoPendiente:  multas.filter(m=>m.estado==='PENDIENTE').reduce((s,m) => s + parseFloat(m.monto_multa||0), 0),
    }
  },

  // ── Usuarios ─────────────────────────────────────────────────
  fetchUsers: async () => {
    set({ loadingUsers: true })
    try {
      const { data } = await getUsers()
      set({ users: data.users ?? data.data ?? data, loadingUsers: false })
    } catch {
      set({ loadingUsers: false })
    }
  },

  assignRole: async (userId, roleName) => {
    try {
      await assignRole(userId, roleName)
      await get().fetchUsers()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || 'Error' }
    }
  },

  removeRole: async (userId, roleName) => {
    try {
      await removeRole(userId, roleName)
      await get().fetchUsers()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || 'Error' }
    }
  },

  // ── Multas ────────────────────────────────────────────────────
  fetchMultas: async () => {
    set({ loadingMultas: true })
    try {
      const { data } = await getMultas()
      set({ multas: data.multas ?? data.data ?? data, loadingMultas: false })
    } catch {
      set({ loadingMultas: false })
    }
  },

  fetchMultasByPlaca: async (placa) => {
    set({ loadingMultas: true })
    try {
      const { data } = await getMultasPorPlaca(placa)
      set({ multas: data.multas ?? [], loadingMultas: false })
    } catch {
      set({ loadingMultas: false })
    }
  },

  actualizarMulta: async (id, datos) => {
    try {
      await actualizarMulta(id, datos)
      await get().fetchMultas()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || 'Error' }
    }
  },

  aumentarMultas: async () => {
    try {
      const { data } = await aumentarMultas()
      await get().fetchMultas()
      return { ok: true, message: data.message }
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || 'Error' }
    }
  },

  registrarInfraccion: async (datos) => {
    try {
      const { data } = await registrarInfraccion(datos)
      await get().fetchMultas()
      return { ok: true, message: data.message, reporte: data.reporte }
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || 'Error al registrar infracción' }
    }
  },

  // ── Vehículos ─────────────────────────────────────────────────
  fetchVehiculos: async () => {
    set({ loadingVehiculos: true })
    try {
      const { data } = await getVehiculos()
      set({ vehiculos: data.vehiculos ?? data.data ?? [], loadingVehiculos: false })
    } catch {
      set({ loadingVehiculos: false })
    }
  },

  registrarVehiculo: async (datos) => {
    try {
      const { data } = await registrarVehiculo(datos)
      await get().fetchVehiculos()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || 'Error' }
    }
  },

  // ── Cámara ────────────────────────────────────────────────────
  toggleCamara: (val) => set({ camaraActiva: val }),

  iniciarCamara: async () => {
    set({ loadingCamara: true })
    try {
      const { data } = await iniciarCamara()
      set({ camaraActiva: true, loadingCamara: false })
      return { ok: true, message: data.message }
    } catch (err) {
      set({ loadingCamara: false })
      return { ok: false, message: err.response?.data?.message || 'Error al iniciar cámara' }
    }
  },

  // ── Cargar todo ───────────────────────────────────────────────
  fetchAll: async () => {
    const store = get()
    await Promise.all([store.fetchUsers(), store.fetchMultas(), store.fetchVehiculos()])
  },
}))

export default useAdminStore