import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import PALayout from './layouts/PALayout'
import EnquiryPage from './pages/EnquiryPage'
import LoginPage from './pages/LoginPage'

const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const EnquiriesPage = lazy(() => import('./pages/admin/EnquiriesPage'))
const PAManagementPage = lazy(() => import('./pages/admin/PAManagementPage'))
const CoursesPage = lazy(() => import('./pages/admin/CoursesPage'))

const PADashboardPage = lazy(() => import('./pages/pa/PADashboardPage'))
const PAEnquiriesPage = lazy(() => import('./pages/pa/PAEnquiriesPage'))

import { ROLES } from './utils/constants'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/enquiry" replace />} />
          <Route path="/enquiry" element={<EnquiryPage />} />
          <Route path="/admin/login" element={<LoginPage role={ROLES.ADMIN} />} />
          <Route path="/pa/login" element={<LoginPage role={ROLES.PA} />} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role={ROLES.ADMIN}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="enquiries" element={<EnquiriesPage />} />
            <Route path="pa-management" element={<PAManagementPage />} />
            <Route path="courses" element={<CoursesPage />} />
          </Route>

          {/* PA Protected Routes */}
          <Route
            path="/pa"
            element={
              <ProtectedRoute role={ROLES.PA}>
                <PALayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PADashboardPage />} />
            <Route path="enquiries" element={<PAEnquiriesPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/enquiry" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
