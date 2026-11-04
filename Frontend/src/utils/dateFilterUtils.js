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

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const THIS_YEAR = new Date().getFullYear()

export const getDaysInMonth = (year, month) =>
  new Date(Number(year) || THIS_YEAR, Number(month) || 1, 0).getDate()

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

// Custom range is only sent to the API once both dates are chosen.
export const isFilterReady = (v) => v.preset !== 'custom' || Boolean(v.from && v.to)

