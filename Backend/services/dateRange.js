// Timezone-safe date ranges. All "days" are calendar days in India Standard Time (UTC+05:30, no DST).
// Ranges are half-open [start, end) so records at 23:59:59.999 / 00:00:00.000 are never lost or doubled.
import { ApiError } from '../utils/response.js';

export const TIMEZONE = 'Asia/Kolkata';
const OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Shift to "IST wall clock" so UTC getters return IST parts.
export const istParts = (date) => {
  const d = new Date(date.getTime() + OFFSET_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() };
};
export const istStart = (y, m, d = 1) => new Date(Date.UTC(y, m, d) - OFFSET_MS);
const addDays = (date, n) => new Date(date.getTime() + n * DAY_MS);

const parseDay = (s, field) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof s === 'string' ? s : '');
  if (!match) throw new ApiError(400, `Invalid ${field} date, expected YYYY-MM-DD`);
  const [y, m, d] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])];
  const check = new Date(Date.UTC(y, m, d));
  if (check.getUTCMonth() !== m || check.getUTCDate() !== d) throw new ApiError(400, `Invalid ${field} date`);
  return { y, m, d };
};

const int = (v, field, min, max) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw new ApiError(400, `Invalid ${field}`);
  return n;
};

/**
 * Resolve query params into { start, end, label } (or null for "all time").
 * Supports: preset=today|yesterday|last7|last30|thisMonth|lastMonth|thisYear|all|custom (+from,to),
 *           or year[&month[&day]].
 */
export const resolveRange = (query = {}, now = new Date()) => {
  const q = (k) => (typeof query[k] === 'string' && query[k] !== '' ? query[k] : undefined);
  const { y, m, d } = istParts(now);
  const today = istStart(y, m, d);

  if (q('year')) {
    const year = int(q('year'), 'year', 2000, 2100);
    if (q('month')) {
      const month = int(q('month'), 'month', 1, 12) - 1;
      if (q('day')) {
        const day = int(q('day'), 'day', 1, 31);
        const start = istStart(year, month, day);
        if (istParts(start).m !== month) throw new ApiError(400, 'Invalid day');
        return { start, end: addDays(start, 1), label: 'day' };
      }
      return { start: istStart(year, month, 1), end: istStart(year, month + 1, 1), label: 'month' };
    }
    return { start: istStart(year, 0, 1), end: istStart(year + 1, 0, 1), label: 'year' };
  }

  switch (q('preset')) {
    case undefined:
    case 'all':
      return null;
    case 'today':
      return { start: today, end: addDays(today, 1), label: 'today' };
    case 'yesterday':
      return { start: addDays(today, -1), end: today, label: 'yesterday' };
    case 'last7':
      return { start: addDays(today, -6), end: addDays(today, 1), label: 'last7' };
    case 'last30':
      return { start: addDays(today, -29), end: addDays(today, 1), label: 'last30' };
    case 'thisMonth':
      return { start: istStart(y, m, 1), end: istStart(y, m + 1, 1), label: 'thisMonth' };
    case 'lastMonth':
      return { start: istStart(y, m - 1, 1), end: istStart(y, m, 1), label: 'lastMonth' };
    case 'thisYear':
      return { start: istStart(y, 0, 1), end: istStart(y + 1, 0, 1), label: 'thisYear' };
    case 'custom': {
      const f = parseDay(q('from'), 'from');
      const t = parseDay(q('to') ?? q('from'), 'to');
      const start = istStart(f.y, f.m, f.d);
      const last = istStart(t.y, t.m, t.d);
      if (last < start) throw new ApiError(400, '"to" date must not be before "from" date');
      if ((last - start) / DAY_MS > 3660) throw new ApiError(400, 'Date range too large');
      return { start, end: addDays(last, 1), label: 'custom' };
    }
    default:
      throw new ApiError(400, 'Invalid preset');
  }
};

export const createdAtMatch = (range) => (range ? { createdAt: { $gte: range.start, $lt: range.end } } : {});

export const daysBetween = (start, end) => Math.round((end - start) / DAY_MS);

// Key helpers matching $dateToString output in the IST timezone.
export const dayKey = (date) => {
  const { y, m, d } = istParts(date);
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};
export const monthKey = (date) => dayKey(date).slice(0, 7);

export const tomorrowStart = (now = new Date()) => {
  const { y, m, d } = istParts(now);
  return istStart(y, m, d + 1);
};
export const todayStart = (now = new Date()) => {
  const { y, m, d } = istParts(now);
  return istStart(y, m, d);
};
export const monthStart = (now = new Date()) => {
  const { y, m } = istParts(now);
  return istStart(y, m, 1);
};
export const yearStart = (now = new Date()) => istStart(istParts(now).y, 0, 1);
export { addDays };

