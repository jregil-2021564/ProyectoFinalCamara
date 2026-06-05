import api from '../../../shared/api/api'
import axios from 'axios'

// Instancia separada para el microservicio de tráfico (puerto 3006)
const traficoApi = axios.create({
  baseURL: import.meta.env.VITE_TRAFICO_URL || 'http://localhost:3006/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Adjunta JWT en traficoApi también (excepto infracciones)
traficoApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Usuarios (ms-auth puerto 3005) ────────────────────────────────
export const getUsers    = ()                 => api.get('/admin/roles/users')
export const assignRole  = (userId, roleName) => api.post('/admin/roles/assign', { userId, roleName })
export const removeRole  = (userId, roleName) => api.delete('/admin/roles/remove', { data: { userId, roleName } })

// ── Multas / Tráfico (ms-core puerto 3006) ────────────────────────
export const getMultas         = ()         => traficoApi.get('/trafico/multas')
export const getMultasPorPlaca = (placa)    => traficoApi.get(`/trafico/multas/${placa}`)
export const actualizarMulta   = (id, data) => traficoApi.put(`/trafico/multas/${id}`, data)
export const aumentarMultas    = ()         => traficoApi.put('/trafico/aumentar-multas')

// Infracciones: sin JWT (endpoint público, lo llama Python también)
export const registrarInfraccion = (data) =>
  traficoApi.post('/trafico/infracciones', data, {
    headers: { Authorization: undefined },
  })

// ── Vehículos (ms-core puerto 3006) ──────────────────────────────
export const getVehiculos      = ()      => traficoApi.get('/trafico/vehiculos')
export const registrarVehiculo = (data)  => traficoApi.post('/trafico/vehiculos', data)

// ── Cámara (ms-core puerto 3006) ──────────────────────────────────
export const iniciarCamara     = ()      => traficoApi.post('/camara/iniciar')