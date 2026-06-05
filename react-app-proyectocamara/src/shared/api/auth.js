import api from './api'

// POST /auth/register — multipart/form-data porque acepta imagen
export const registerUser = (formData) =>
  api.post('/auth/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// POST /auth/verify-email
export const verifyEmail = (token) =>
  api.post('/auth/verify-email', { token })

// POST /auth/resend-verification
export const resendVerification = (email) =>
  api.post('/auth/resend-verification', { email })

// POST /auth/login
export const loginUser = (emailOrUsername, password) =>
  api.post('/auth/login', { emailOrUsername, password })

// POST /auth/forgot-password
export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email })

// POST /auth/reset-password
export const resetPassword = (token, newPassword) =>
  api.post('/auth/reset-password', { token, newPassword })
