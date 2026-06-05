import api from '../../../shared/api/api'

// GET /auth/profile
export const getProfile = () => api.get('/auth/profile')

// PUT /auth/profile — multipart (foto opcional)
export const updateProfile = (formData) =>
  api.put('/auth/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// GET /trafico/vehiculos
export const getVehiculos = () => api.get('/trafico/vehiculos')

// POST /trafico/vehiculos
export const registrarVehiculo = (data) => api.post('/trafico/vehiculos', data)

// GET /trafico/multas
export const getTodasMultas = () => api.get('/trafico/multas')

// GET /trafico/multas/:placa
export const getMultasPorPlaca = (placa) => api.get(`/trafico/multas/${placa}`)

// GET /trafico/buscar/:placa
export const buscarPorPlaca = (placa) => api.get(`/trafico/buscar/${placa}`)