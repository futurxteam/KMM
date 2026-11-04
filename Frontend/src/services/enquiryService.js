import api from './api'

export const submitEnquiry = (payload) => api.post('/enquiries', payload).then((r) => r.data)
// Returns [{ id, name }] of ACTIVE courses from MongoDB.
export const fetchCourses = () => api.get('/courses').then((r) => r.data.data.courses)
