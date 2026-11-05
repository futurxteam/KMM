import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { initials } from '../../utils/format'

export default function Navbar({ title, user, collapsed, onToggleCollapse, onOpenMobile, onLogout, roleLabel = 'Administrator' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 backdrop-blur sm:h-16 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Open menu"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Toggle sidebar"
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:inline-flex"
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
        <div className="min-w-0 leading-tight">
          <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base">{title}</h1>
          <p className="hidden truncate text-xs text-slate-500 sm:block">
            {roleLabel} <span className="mx-1">/</span> {title}
          </p>
        </div>
      </div>

      <div className="relative shrink-0" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-[40px] items-center gap-2 rounded-lg p-1 pr-2 hover:bg-slate-100"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-semibold text-white sm:h-9 sm:w-9 sm:text-sm">
            {initials(user?.name)}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block max-w-[140px] truncate text-sm font-medium text-slate-900">{user?.name}</span>
            <span className="block text-[11px] text-slate-500">{roleLabel}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
        {open && (
          <div role="menu" className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <div className="border-b border-slate-100 px-4 py-2.5">
              <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email || user?.username}</p>
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              className="flex min-h-[40px] w-full items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
