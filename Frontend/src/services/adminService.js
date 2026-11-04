import api from './api'

const unwrap = (r) => r.data.data
// Drop empty values so they are not sent as query params.
const clean = (params = {}) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))

export const getDashboard = {
  stats: (p) => api.get('/admin/dashboard/stats', { params: clean(p) }).then(unwrap),
  trend: (p) => api.get('/admin/dashboard/enquiries-trend', { params: clean(p) }).then(unwrap),
  courseStats: (p) => api.get('/admin/dashboard/course-stats', { params: clean(p) }).then(unwrap),
  contactStats: (p) => api.get('/admin/dashboard/contact-stats', { params: clean(p) }).then(unwrap),
  monthly: () => api.get('/admin/dashboard/monthly-trends').then(unwrap),
  recent: () => api.get('/admin/dashboard/recent-activity').then(unwrap),
  paPerformance: () => api.get('/admin/dashboard/pa-performance').then(unwrap),
}

export const listEnquiries = (p) => api.get('/admin/enquiries', { params: clean(p) }).then(unwrap)
export const getEnquiryDetails = (id) => api.get(`/admin/enquiries/${id}`).then(unwrap)
export const listEnquiryCourses = () => api.get('/admin/enquiries/courses').then(unwrap)

export const listPAs = () => api.get('/admin/pa').then(unwrap)
export const createPA = (b) => api.post('/admin/pa', b).then(unwrap)
export const updatePA = (id, b) => api.put(`/admin/pa/${id}`, b).then(unwrap)
export const deletePA = (id) => api.delete(`/admin/pa/${id}`).then(unwrap)

export const listCoursesAdmin = () => api.get('/admin/courses').then(unwrap)
export const createCourse = (b) => api.post('/admin/courses', b).then(unwrap)
export const updateCourse = (id, b) => api.put(`/admin/courses/${id}`, b).then(unwrap)
export const deleteCourse = (id) => api.delete(`/admin/courses/${id}`).then(unwrap)

