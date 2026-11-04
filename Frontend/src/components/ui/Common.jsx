import { AlertCircle, Inbox, Loader2 } from 'lucide-react'

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', message, icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center sm:py-12">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <AlertCircle className="mb-2 h-8 w-8 text-red-400" />
      <p className="text-sm text-slate-600">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-3">
          Try again
        </button>
      )}
    </div>
  )
}

export function Card({ title, subtitle, action, children, className = '', padded = true }) {
  return (
    <section className={`min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={padded ? 'p-4 sm:p-5' : ''}>{children}</div>
    </section>
  )
}

export function StatCard({ title, value, icon: Icon, tone = 'brand', hint, loading }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    sky: 'bg-sky-50 text-sky-600',
    rose: 'bg-rose-50 text-rose-600',
  }
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">{title}</p>
          <p className="mt-1.5 truncate text-xl font-bold text-slate-900 sm:mt-2 sm:text-3xl">{loading ? '—' : value}</p>
        </div>
        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg sm:h-10 sm:w-10 ${tones[tone]}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
      {hint && <p className="mt-2 truncate text-[11px] text-slate-500 sm:mt-3 sm:text-xs">{hint}</p>}
    </div>
  )
}
