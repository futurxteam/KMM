// Accepts Indian mobile numbers: 10 digits starting 6-9, optional +91 / 91 / 0 prefix.
export const normalizePhone = (value) => {
  let digits = String(value ?? '').replace(/[\s\-().]/g, '')
  if (!/^\+?\d+$/.test(digits)) return null
  digits = digits.replace(/^\+/, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  return /^[6-9]\d{9}$/.test(digits) ? digits : null
}

export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)

export const validatePhone = (value, label) => {
  if (!String(value ?? '').trim()) return `${label} is required`
  if (!normalizePhone(value)) return 'Enter a valid 10-digit Indian mobile number'
  return ''
}

export const validateEnquiry = (v) => {
  const e = {}
  if (!v.name.trim()) e.name = 'Name is required'
  const p = validatePhone(v.phone, 'Phone number')
  if (p) e.phone = p
  const s = validatePhone(v.secondaryPhone, 'Secondary phone number')
  if (s) e.secondaryPhone = s
  if (!v.course) e.course = 'Please select a course'
  if (v.email.trim() && !isValidEmail(v.email.trim())) e.email = 'Enter a valid email address'
  if (v.notes.length > 1000) e.notes = 'Notes must be at most 1000 characters'
  return e
}

