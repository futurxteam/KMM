import { useState } from 'react'
import { CalendarDays } from 'lucide-react'

export const PRESETS = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Previous month' },
  { value: 'thisYear', label: 'This year' },
]
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const formatDateFilterSummary = (v) => {
  if (!v) return ''
  if (v.year) {
    const m = v.month ? ` ${MONTHS[Number(v.month) - 1]?.slice(0, 3)}` : ''
    const d = v.day ? ` ${v.day}` : ''
    return `${v.year}${m}${d}`
  }
  if (v.preset === 'custom') {
    if (v.from && v.to) return `${v.from} → ${v.to}`
    if (v.from) return `From ${v.from}`
    return ''
  }
  if (!v.preset || v.preset === 'all') return ''
  return PRESETS.find((p) => p.value === v.preset)?.label || v.preset
}

// `value` is the query-param object consumed by the API: { preset } | { preset:'custom', from, to } | { year, month?, day? }
// Compact mode selector + inputs; emits the param object through onChange.
export default function DateFilter({ value, onChange, stacked = false }) {
  const thisYear = new Date().getFullYear()
  const [prevVal, setPrevVal] = useState(value)
  const [mode, setMode] = useState(value.year ? 'ymd' : value.preset === 'custom' ? 'custom' : 'preset')

  if (value !== prevVal) {
    setPrevVal(value)
    const nextMode = value.year ? 'ymd' : value.preset === 'custom' ? 'custom' : 'preset'
    if (nextMode !== mode) setMode(nextMode)
  }

  const switchMode = (m) => {
    setMode(m)
    if (m === 'preset') onChange({ preset: 'last30' })
    if (m === 'custom') onChange({ preset: 'custom', from: '', to: '' })
    if (m === 'ymd') onChange({ year: String(thisYear) })
  }

  const setYmd = (patch) => {
    const next = { year: value.year, month: value.month, day: value.day, ...patch }
    if (!next.month) delete next.month
    if (!next.month || !next.day) delete next.day
    onChange(Object.fromEntries(Object.entries(next).filter(([, v]) => v)))
  }

  if (stacked) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-slate-100 p-1">
          {[
            { id: 'preset', label: 'Presets' },
            { id: 'custom', label: 'Custom' },
            { id: 'ymd', label: 'Y / M / D' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchMode(tab.id)}
              className={`min-h-[36px] rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                mode === tab.id ? 'bg-white text-brand-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mode === 'preset' && (
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => {
              const active = (value.preset || 'all') === p.value
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => onChange({ preset: p.value })}
                  className={`min-h-[38px] rounded-lg border px-3 py-1.5 text-left text-xs font-medium transition ${
                    active ? 'border-brand-600 bg-brand-50 font-semibold text-brand-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        )}

        {mode === 'custom' && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">From date</label>
              <input
                type="date"
                value={value.from || ''}
                max={value.to || undefined}
                onChange={(e) => onChange({ preset: 'custom', from: e.target.value, to: value.to || '' })}
                className="field"
                aria-label="From date"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">To date</label>
              <input
                type="date"
                value={value.to || ''}
                min={value.from || undefined}
                onChange={(e) => onChange({ preset: 'custom', from: value.from || '', to: e.target.value })}
                className="field"
                aria-label="To date"
              />
            </div>
          </div>
        )}

        {mode === 'ymd' && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Year</label>
              <select
                value={value.year || ''}
                onChange={(e) => setYmd({ year: e.target.value || String(thisYear) })}
                className="field"
                aria-label="Year"
              >
                {Array.from({ length: 6 }, (_, i) => thisYear - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Month</label>
              <select
                value={value.month || ''}
                onChange={(e) => setYmd({ month: e.target.value, day: '' })}
                className="field"
                aria-label="Month"
              >
                <option value="">All</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m.slice(0, 3)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Day</label>
              <select
                value={value.day || ''}
                disabled={!value.month}
                onChange={(e) => setYmd({ day: e.target.value })}
                className="field"
                aria-label="Day"
              >
                <option value="">All</option>
                {Array.from({ length: new Date(Number(value.year) || thisYear, Number(value.month) || 1, 0).getDate() }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <CalendarDays className="hidden h-4 w-4 text-slate-400 sm:block" />
      <select value={mode} onChange={(e) => switchMode(e.target.value)} className="field !w-auto min-w-[130px] flex-1 sm:flex-initial" aria-label="Filter type">
        <option value="preset">Quick range</option>
        <option value="custom">Custom range</option>
        <option value="ymd">Year / Month / Day</option>
      </select>

      {mode === 'preset' && (
        <select value={value.preset || 'all'} onChange={(e) => onChange({ preset: e.target.value })} className="field !w-auto min-w-[140px] flex-1 sm:flex-initial" aria-label="Date range">
          {PRESETS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      )}

      {mode === 'custom' && (
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <input type="date" value={value.from || ''} max={value.to || undefined} onChange={(e) => onChange({ preset: 'custom', from: e.target.value, to: value.to || '' })} className="field !w-auto flex-1 sm:flex-initial" aria-label="From date" />
          <span className="text-xs text-slate-400">to</span>
          <input type="date" value={value.to || ''} min={value.from || undefined} onChange={(e) => onChange({ preset: 'custom', from: value.from || '', to: e.target.value })} className="field !w-auto flex-1 sm:flex-initial" aria-label="To date" />
        </div>
      )}

      {mode === 'ymd' && (
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <select value={value.year || ''} onChange={(e) => setYmd({ year: e.target.value || String(thisYear) })} className="field !w-auto flex-1 sm:flex-initial" aria-label="Year">
            {Array.from({ length: 6 }, (_, i) => thisYear - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select value={value.month || ''} onChange={(e) => setYmd({ month: e.target.value, day: '' })} className="field !w-auto flex-1 sm:flex-initial" aria-label="Month">
            <option value="">All months</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select value={value.day || ''} disabled={!value.month} onChange={(e) => setYmd({ day: e.target.value })} className="field !w-auto flex-1 sm:flex-initial" aria-label="Day">
            <option value="">All days</option>
            {Array.from({ length: new Date(Number(value.year) || thisYear, Number(value.month) || 1, 0).getDate() }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

// Custom range is only sent to the API once both dates are chosen.
export const isFilterReady = (v) => v.preset !== 'custom' || Boolean(v.from && v.to)
