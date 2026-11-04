import api from './api'

export const loginAdmin = (payload) => api.post('/auth/admin/login', payload).then((r) => r.data.data)
export const loginPA = (payload) => api.post('/auth/pa/login', payload).then((r) => r.data.data)
export const fetchMe = () => api.get('/auth/me').then((r) => r.data.data.user)
export const logoutRequest = () => api.post('/auth/logout').catch(() => {})

