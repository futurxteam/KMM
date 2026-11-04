import api from './api'

const unwrap = (r) => r.data.data
const clean = (params = {}) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))

export const getPADashboardStats = () => api.get('/pa/dashboard/stats').then(unwrap)
export const listPAEnquiries = (p) => api.get('/pa/enquiries', { params: clean(p) }).then(unwrap)
export const getPAEnquiryCourses = () => api.get('/pa/enquiries/courses').then(unwrap)
export const getPAEnquiryDetails = (id) => api.get(`/pa/enquiries/${id}`).then(unwrap)
export const updateEnquiryStatus = (id, status) => api.patch(`/pa/enquiries/${id}/status`, { status }).then(unwrap)

