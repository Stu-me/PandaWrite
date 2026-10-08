import api from '../api/axios'

export const authService = {
  login: (credentials) => api.post('/api/auth/login', credentials),

  requestLoginOtp: (email) => api.post('/api/auth/login/request-otp', { email }),

  verifyLoginOtp: (data) => api.post('/api/auth/login/verify-otp', data),

  register: (data) => api.post('/api/auth/register', data),

  getMe: () => api.get('/api/auth/me'),

  forgotPassword: (email) => api.post('/api/auth/forgotpassword', { email }),

  resetPassword: (token, password) => api.put(`/api/auth/resetpassword/${token}`, { password }),
}