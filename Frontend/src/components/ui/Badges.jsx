export function StatusBadge({ status }) {
  const contacted = status === 'CONTACTED'
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        contacted ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${contacted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      {contacted ? 'CONTACTED' : 'NOT CONTACTED'}
    </span>
  )
}

export function ActiveBadge({ active }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}
