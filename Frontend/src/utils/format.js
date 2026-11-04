export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—'

export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
      })
    : '—'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
// 'YYYY-MM-DD' -> '05 Feb'; 'YYYY-MM' -> 'Feb 2026'
export const fmtBucket = (key) => {
  const [y, m, d] = key.split('-')
  return d ? `${d} ${MONTHS[Number(m) - 1]}` : `${MONTHS[Number(m) - 1]} ${y}`
}

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || 'A'

