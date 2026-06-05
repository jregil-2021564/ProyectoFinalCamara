import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request: adjunta JWT ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: manejo de errores ────────────────────────────────────────────────
// Retry automático con backoff exponencial cuando el servidor responde 429
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config

    // ── 429 Too Many Requests — reintenta hasta 3 veces con espera exponencial
    if (error.response?.status === 429) {
      config._retryCount = config._retryCount || 0

      if (config._retryCount < 3) {
        config._retryCount++
        // Espera: 4s, 8s, 16s entre reintentos
        const waitMs = 4000 * Math.pow(2, config._retryCount - 1)
        console.warn(`Rate limit alcanzado. Reintento ${config._retryCount}/3 en ${waitMs / 1000}s...`)
        await sleep(waitMs)
        return api(config)
      }

      // Si agotó los reintentos, devuelve mensaje amigable
      return Promise.reject({
        ...error,
        response: {
          ...error.response,
          data: {
            message: 'Demasiadas solicitudes. Por favor espera un momento e intenta de nuevo.',
          },
        },
      })
    }

    // ── 401 Unauthorized — limpia sesión solo fuera del auth
    if (error.response?.status === 401) {
      const path = window.location.pathname
      if (!path.includes('/auth') && !path.includes('/verify-email')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/auth'
      }
    }

    return Promise.reject(error)
  }
)

export default api