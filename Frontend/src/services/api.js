import axios from 'axios'
import { TOKEN_KEY } from '../utils/constants'

const DEFAULT_API_BASE_URL = 'https://kmm-2.onrender.com/api'

function resolveBaseUrl(raw) {
  const trimmed = (raw || '').trim().replace(/\/+$/, '')
  if (!trimmed) return DEFAULT_API_BASE_URL
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : /^(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(trimmed)
      ? `http://${trimmed}`
      : `https://${trimmed}`
  return withProtocol.endsWith('/api') ? withProtocol : `${withProtocol}/api`
}

const api = axios.create({
  baseURL: resolveBaseUrl(import.meta.env.VITE_API_BASE_URL),
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401 for an authenticated request (expired/invalid token), notify the auth layer.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || ''
    if (error.response?.status === 401 && !url.includes('/login') && localStorage.getItem(TOKEN_KEY)) {
      window.dispatchEvent(new CustomEvent('auth:expired'))
    }
    return Promise.reject(error)
  }
)

export const getErrorInfo = (error) => {
  if (!error.response) {
    return { message: 'Unable to reach the server. Please check your connection and try again.', errors: {} }
  }
  const { message, errors } = error.response.data || {}
  return { message: message || 'Something went wrong. Please try again.', errors: errors || {} }
}

export default api
