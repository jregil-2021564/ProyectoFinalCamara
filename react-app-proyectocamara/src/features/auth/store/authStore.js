import { create } from 'zustand'
import {
  loginUser,
  registerUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from '../../../shared/api/auth'

const useAuthStore = create((set) => ({
  user: (() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })(),
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  // ── LOGIN ──────────────────────────────────────────────
  login: async (emailOrUsername, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await loginUser(emailOrUsername, password)
      console.log('RESPUESTA LOGIN COMPLETA:', data)
      // El backend devuelve: { success, token, userDetails, expiresAt }
      const token = data.token
      const user = data.userDetails ?? data.user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      set({ user, token, loading: false })
      return { ok: true, user }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al iniciar sesión'
      set({ error: msg, loading: false })
      return { ok: false, message: msg }
    }
  },

  // ── REGISTER ───────────────────────────────────────────
  register: async (formData) => {
    set({ loading: true, error: null })
    try {
      const { data } = await registerUser(formData)
      set({ loading: false })
      return { ok: true, message: data.message }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al registrarse'
      set({ error: msg, loading: false })
      return { ok: false, message: msg }
    }
  },

  // ── VERIFY EMAIL ───────────────────────────────────────
  verify: async (token) => {
    set({ loading: true, error: null })
    try {
      const { data } = await verifyEmail(token)
      set({ loading: false })
      return { ok: true, message: data.message }
    } catch (err) {
      const msg = err.response?.data?.message || 'Token inválido o expirado'
      set({ error: msg, loading: false })
      return { ok: false, message: msg }
    }
  },

  // ── RESEND VERIFICATION ────────────────────────────────
  resend: async (email) => {
    set({ loading: true, error: null })
    try {
      const { data } = await resendVerification(email)
      set({ loading: false })
      return { ok: true, message: data.message }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al reenviar correo'
      set({ error: msg, loading: false })
      return { ok: false, message: msg }
    }
  },

  // ── FORGOT PASSWORD ────────────────────────────────────
  forgot: async (email) => {
    set({ loading: true, error: null })
    try {
      const { data } = await forgotPassword(email)
      set({ loading: false })
      return { ok: true, message: data.message }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al enviar correo'
      set({ error: msg, loading: false })
      return { ok: false, message: msg }
    }
  },

  // ── RESET PASSWORD ─────────────────────────────────────
  reset: async (token, newPassword) => {
    set({ loading: true, error: null })
    try {
      const { data } = await resetPassword(token, newPassword)
      set({ loading: false })
      return { ok: true, message: data.message }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al restablecer contraseña'
      set({ error: msg, loading: false })
      return { ok: false, message: msg }
    }
  },

  // ── LOGOUT ─────────────────────────────────────────────
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },
}))

export default useAuthStore
