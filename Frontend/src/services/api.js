import axios from 'axios'
import { TOKEN_KEY } from '../utils/constants'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
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

