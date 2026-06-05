import api from '../../../shared/api/api'
import axios from 'axios'

const coreApi = axios.create({
  baseURL: import.meta.env.VITE_TRAFICO_URL || 'http://localhost:3006/api/v1',
  headers: { 'Content-Type': 'application/json' },
})
coreApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
coreApi.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status
    const method = err.config?.method?.toUpperCase()
    if (status === 404 && method === 'GET') {
      return Promise.resolve({ data: { success: false, tarjetas:[], recargas:[], multas:[] } })
    }
    return Promise.reject(err)
  }
)

export const getMiCuenta          = ()                   => coreApi.get('/cuenta/mi-cuenta')
export const getMiSaldo           = ()                   => coreApi.get('/saldo/mi-saldo')
export const getMisTarjetas       = ()                   => coreApi.get('/saldo/mis-tarjetas')
export const eliminarTarjeta      = (id)                 => coreApi.delete(`/saldo/mis-tarjetas/${id}`)
export const agregarTarjeta       = (data)               => coreApi.post('/saldo/agregar-tarjeta', {
  numeroTarjeta:    data.numeroTarjeta    || data.numero,
  fechaVencimiento: data.fechaVencimiento || data.expiracion,
  cvv:              data.cvv,
  nombreTitular:    data.nombreTitular    || data.titular,
  tipoTarjeta:      data.tipoTarjeta      || 'CREDITO',
  alias:            data.alias            || null,
})
export const verificarTarjeta     = (codigo)             => coreApi.post('/saldo/verificar-tarjeta', { token: String(codigo) })
export const getHistorialRecargas = ()                   => coreApi.get('/saldo/historial')
export const agregarRecarga       = (tarjetaId, monto)   => coreApi.post('/saldo/recargar', { tarjetaId: String(tarjetaId), monto: parseFloat(monto) })
export const getMisMultas         = ()                   => coreApi.get('/pagos/mis-multas')

// Pagar con tarjeta de crédito
export const pagarMultaConTarjeta = (multaId, tarjetaId) => coreApi.post('/pagos/pagar-multa', {
  multaId:   String(multaId),
  tarjetaId: String(tarjetaId),
})

// Pagar con saldo de cuenta
export const pagarMultaConSaldo   = (multaId)            => coreApi.post(`/trafico/pagar/${multaId}`)