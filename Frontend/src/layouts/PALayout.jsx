import { useState, Suspense } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MessageSquareText } from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import Navbar from '../components/layout/Navbar'
import { Spinner } from '../components/ui/Common'
import { ToastProvider } from '../components/ui/Toast'
import useAuth from '../hooks/useAuth'

const PA_NAV = [
  { to: '/pa/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/pa/enquiries', label: 'All Enquiries', icon: MessageSquareText },
]

const TITLES = {
  '/pa/dashboard': 'Dashboard',
  '/pa/enquiries': 'All Enquiries',
}

export default function PALayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('kmm_pa_sidebar') === '1')
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggle = () =>
    setCollapsed((c) => {
      localStorage.setItem('kmm_pa_sidebar', c ? '0' : '1')
      return !c
    })

  const handleLogout = async () => {
    await logout()
    navigate('/pa/login', { replace: true })
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onLogout={handleLogout}
          items={PA_NAV}
        />
        <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
          <Navbar
            title={TITLES[pathname] || 'PA Dashboard'}
            user={user}
            collapsed={collapsed}
            onToggleCollapse={toggle}
            onOpenMobile={() => setMobileOpen(true)}
            onLogout={handleLogout}
            roleLabel="Personal Assistant"
          />
          <main className="mx-auto max-w-[1600px] p-4 sm:p-6">
            <Suspense fallback={<Spinner />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}

