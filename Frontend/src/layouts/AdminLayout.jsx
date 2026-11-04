import { Suspense, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Navbar from '../components/layout/Navbar'
import { Spinner } from '../components/ui/Common'
import { ToastProvider } from '../components/ui/Toast'
import useAuth from '../hooks/useAuth'

const TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/enquiries': 'Enquiries',
  '/admin/pa-management': 'PA Management',
  '/admin/courses': 'Course Management',
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('kmm_sidebar') === '1')
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggle = () =>
    setCollapsed((c) => {
      localStorage.setItem('kmm_sidebar', c ? '0' : '1')
      return !c
    })

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} onLogout={handleLogout} />
        <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
          <Navbar
            title={TITLES[pathname] || 'Admin'}
            user={user}
            collapsed={collapsed}
            onToggleCollapse={toggle}
            onOpenMobile={() => setMobileOpen(true)}
            onLogout={handleLogout}
          />
          <main className="mx-auto max-w-[1600px] p-4 sm:p-6">
            <Suspense fallback={<Spinner />}><Outlet /></Suspense>
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}

