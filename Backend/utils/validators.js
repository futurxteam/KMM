// Normalises Indian phone numbers; returns 10-digit string or null.
export const normalizePhone = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  let digits = String(value).replace(/[\s\-().]/g, '');
  if (!/^\+?\d+$/.test(digits)) return null;
  digits = digits.replace(/^\+/, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
};

export const isValidEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254;

// Returns the trimmed string, or '' for any non-string (blocks object/operator injection).
export const str = (v) => (typeof v === 'string' ? v.trim() : '');

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Min 10 chars with upper, lower, digit and symbol.
export const passwordProblem = (pw) => {
  if (typeof pw !== 'string' || pw.length < 10) return 'Password must be at least 10 characters';
  if (pw.length > 72) return 'Password must be at most 72 characters';
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw) || !/[^A-Za-z0-9]/.test(pw)) {
    return 'Password must include upper-case, lower-case, a number and a symbol';
  }
  return '';
};

// PA passwords: slightly relaxed (min 8, letters + number).
export const paPasswordProblem = (pw) => {
  if (typeof pw !== 'string' || pw.length < 8) return 'Password must be at least 8 characters';
  if (pw.length > 72) return 'Password must be at most 72 characters';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Password must contain letters and numbers';
  return '';
};

export const isObjectId = (v) => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);
