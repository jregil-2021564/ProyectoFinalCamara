import api from '../../../shared/api/api'
import axios from 'axios'

// ms-core (puerto 3006) para vehículos y multas
const traficoApi = axios.create({
  baseURL: import.meta.env.VITE_TRAFICO_URL || 'http://localhost:3006/api/v1',
  headers: { 'Content-Type': 'application/json' },
})
traficoApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Perfil (ms-auth 3005) ─────────────────────────────────────────
export const getProfile     = ()         => api.get('/auth/profile')
export const updateProfile  = (formData) => api.put('/auth/profile', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})

// ── Vehículos (ms-core 3006) ──────────────────────────────────────
export const getVehiculos      = ()      => traficoApi.get('/trafico/vehiculos')
export const registrarVehiculo = (data)  => traficoApi.post('/trafico/vehiculos', data)

// ── Multas (ms-core 3006) ─────────────────────────────────────────
export const getTodasMultas    = ()      => traficoApi.get('/trafico/multas')
export const getMultasPorPlaca = (placa) => traficoApi.get(`/trafico/multas/${placa}`)
export const buscarPorPlaca    = (placa) => traficoApi.get(`/trafico/buscar/${placa}`)