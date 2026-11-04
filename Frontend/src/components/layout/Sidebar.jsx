import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, MessageSquareText, Users, X } from 'lucide-react'

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/enquiries', label: 'Enquiries', icon: MessageSquareText },
  { to: '/admin/pa-management', label: 'PA Management', icon: Users },
  { to: '/admin/courses', label: 'Course Management', icon: BookOpen },
]

function Brand({ collapsed }) {
  return (
    <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 px-5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-600 text-white">
        <GraduationCap className="h-5 w-5" />
      </div>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-bold text-slate-900">KMM College</p>
          <p className="truncate text-[11px] text-slate-500">Enquiry Manager</p>
        </div>
      )}
    </div>
  )
}

function NavItems({ collapsed, onNavigate, onLogout, items = NAV }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {!collapsed && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Navigation</p>}
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            `flex min-h-[42px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            } ${collapsed ? 'justify-center' : ''}`
          }
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </NavLink>
      ))}
      <button
        type="button"
        onClick={onLogout}
        title={collapsed ? 'Logout' : undefined}
        className={`mt-auto flex min-h-[42px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 ${collapsed ? 'justify-center' : ''}`}
      >
        <LogOut className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span>Logout</span>}
      </button>
    </nav>
  )
}

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile, onLogout, items = NAV }) {
  useEffect(() => {
    if (!mobileOpen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onCloseMobile()
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen, onCloseMobile])

  return (
    <>
      {/* Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-slate-200 bg-white transition-[width] duration-200 lg:flex ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <Brand collapsed={collapsed} />
        <NavItems collapsed={collapsed} onLogout={onLogout} items={items} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <motion.div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-72 max-w-[82vw] flex-col bg-white shadow-2xl"
              initial={{ x: -290 }}
              animate={{ x: 0 }}
              exit={{ x: -290 }}
              transition={{ type: 'tween', duration: 0.2 }}
            >
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close menu"
                className="absolute right-3 top-3.5 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
              <Brand />
              <NavItems onNavigate={onCloseMobile} onLogout={onLogout} items={items} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
