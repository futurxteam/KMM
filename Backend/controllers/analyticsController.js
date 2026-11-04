import Enquiry from '../models/Enquiry.js';
import Course from '../models/Course.js';
import PA from '../models/PA.js';
import { ok, asyncHandler } from '../utils/response.js';
import {
  TIMEZONE, resolveRange, createdAtMatch, daysBetween, dayKey, monthKey, istParts, istStart,
  todayStart, tomorrowStart, monthStart, yearStart, addDays,
} from '../services/dateRange.js';

const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : null);

// Per-course counts for the filtered range; active courses with zero enquiries are included
// so "fewest enquiries" is meaningful. Historic names of renamed/deleted courses are kept too.
const courseCounts = async (match) => {
  const [grouped, active] = await Promise.all([
    Enquiry.aggregate([
      { $match: match },
      { $group: { _id: '$course', count: { $sum: 1 }, contacted: { $sum: { $cond: [{ $eq: ['$status', 'CONTACTED'] }, 1, 0] } } } },
    ]),
    Course.find({ isActive: true }).select('name').lean(),
  ]);
  const map = new Map(grouped.map((g) => [g._id, { course: g._id, count: g.count, contacted: g.contacted }]));
  for (const c of active) if (!map.has(c.name)) map.set(c.name, { course: c.name, count: 0, contacted: 0 });
  return [...map.values()].sort((a, b) => b.count - a.count || a.course.localeCompare(b.course));
};

export const stats = asyncHandler(async (req, res) => {
  const now = new Date();
  const range = resolveRange(req.query, now);
  const match = createdAtMatch(range);
  const C = { status: 'CONTACTED' };

  const [total, today, month, year, contacted, filteredTotal, filteredContacted, first, courses] = await Promise.all([
    Enquiry.countDocuments({}),
    Enquiry.countDocuments({ createdAt: { $gte: todayStart(now), $lt: tomorrowStart(now) } }),
    Enquiry.countDocuments({ createdAt: { $gte: monthStart(now), $lt: tomorrowStart(now) } }),
    Enquiry.countDocuments({ createdAt: { $gte: yearStart(now), $lt: tomorrowStart(now) } }),
    Enquiry.countDocuments(C),
    Enquiry.countDocuments(match),
    Enquiry.countDocuments({ ...match, ...C }),
    range ? null : Enquiry.findOne({}).sort({ createdAt: 1 }).select('createdAt').lean(),
    courseCounts(match),
  ]);

  // Average daily enquiries: only when the period covers at least 2 elapsed days.
  let days = 0;
  if (range) days = daysBetween(range.start, new Date(Math.min(range.end, tomorrowStart(now))));
  else if (first) days = daysBetween(todayStart(first.createdAt), tomorrowStart(now));
  const avgDaily = days >= 2 && filteredTotal > 0 ? Math.round((filteredTotal / days) * 100) / 100 : null;

  const withData = courses.filter((c) => c.count > 0);
  const mostPopular = withData.length ? withData[0] : null;
  const least = courses[courses.length - 1];
  // Fewest is meaningful only with 2+ courses and a real difference between them.
  const fewest = courses.length >= 2 && filteredTotal > 0 && least.count < courses[0].count ? least : null;

  ok(res, {
    overall: {
      total, today, month, year, contacted, notContacted: total - contacted,
      completionPct: pct(contacted, total),
    },
    filtered: {
      total: filteredTotal,
      contacted: filteredContacted,
      notContacted: filteredTotal - filteredContacted,
      completionPct: pct(filteredContacted, filteredTotal),
      avgDaily,
      daysInRange: days,
      mostPopularCourse: mostPopular,
      fewestCourse: fewest,
    },
    range: range ? { start: range.start, end: range.end } : null,
    timezone: TIMEZONE,
  });
});

const fmtFor = (unit) => (unit === 'month' ? '%Y-%m' : '%Y-%m-%d');

const fillSeries = (rows, startDate, endDate, unit) => {
  const map = new Map(rows.map((r) => [r._id, r.count]));
  const out = [];
  if (unit === 'day') {
    for (let d = startDate; d < endDate; d = addDays(d, 1)) {
      const key = dayKey(d);
      out.push({ key, count: map.get(key) || 0 });
    }
  } else {
    const { y, m } = istParts(startDate);
    for (let i = 0; ; i += 1) {
      const s = istStart(y, m + i, 1);
      if (s >= endDate) break;
      const key = monthKey(s);
      out.push({ key, count: map.get(key) || 0 });
    }
  }
  return out;
};

export const enquiriesTrend = asyncHandler(async (req, res) => {
  const now = new Date();
  const range = resolveRange(req.query, now);
  const cap = tomorrowStart(now);

  let start;
  let end;
  if (range) {
    start = range.start;
    end = new Date(Math.min(range.end, cap));
  } else {
    const first = await Enquiry.findOne({}).sort({ createdAt: 1 }).select('createdAt').lean();
    start = first ? first.createdAt : todayStart(now);
    end = cap;
  }
  const spanDays = Math.max(1, daysBetween(start, end));
  const requested = req.query.groupBy === 'month' || req.query.groupBy === 'day' ? req.query.groupBy : null;
  const unit = requested || (spanDays <= 92 ? 'day' : 'month');
  if (unit === 'month') start = istStart(istParts(start).y, istParts(start).m, 1);
  else start = istStart(istParts(start).y, istParts(start).m, istParts(start).d);

  const rows = end > start
    ? await Enquiry.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      { $group: { _id: { $dateToString: { format: fmtFor(unit), date: '$createdAt', timezone: TIMEZONE } }, count: { $sum: 1 } } },
    ])
    : [];
  const series = end > start ? fillSeries(rows, start, end, unit) : [];
  ok(res, { unit, series, total: series.reduce((s, p) => s + p.count, 0) });
});

export const courseStats = asyncHandler(async (req, res) => {
  const range = resolveRange(req.query);
  ok(res, { courses: await courseCounts(createdAtMatch(range)) });
});

export const contactStats = asyncHandler(async (req, res) => {
  const match = createdAtMatch(resolveRange(req.query));
  const [contacted, total] = await Promise.all([
    Enquiry.countDocuments({ ...match, status: 'CONTACTED' }),
    Enquiry.countDocuments(match),
  ]);
  ok(res, { total, contacted, notContacted: total - contacted, completionPct: pct(contacted, total) });
});

// Last 12 calendar months (IST) with month-over-month change.
export const monthlyTrends = asyncHandler(async (_req, res) => {
  const now = new Date();
  const { y, m } = istParts(now);
  const start = istStart(y, m - 11, 1);
  const end = istStart(y, m + 1, 1);
  const rows = await Enquiry.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: TIMEZONE } }, count: { $sum: 1 } } },
  ]);
  const series = fillSeries(rows, start, end, 'month').map((p, i, arr) => {
    const prev = i > 0 ? arr[i - 1].count : null;
    return { ...p, changePct: prev ? Math.round(((p.count - prev) / prev) * 1000) / 10 : null };
  });
  ok(res, { series });
});

export const recentActivity = asyncHandler(async (_req, res) => {
  const [recentEnquiries, paActivity] = await Promise.all([
    Enquiry.find({}).sort({ createdAt: -1 }).limit(8).select('name course status createdAt phone').lean(),
    Enquiry.find({ status: 'CONTACTED', contactedBy: { $ne: null }, contactedAt: { $ne: null } })
      .sort({ contactedAt: -1 }).limit(8).select('name course contactedByName contactedAt').lean(),
  ]);
  ok(res, {
    recentEnquiries: recentEnquiries.map((e) => ({ id: e._id, name: e.name, phone: e.phone, course: e.course, status: e.status, createdAt: e.createdAt })),
    paActivity: paActivity.map((e) => ({ id: e._id, student: e.name, course: e.course, paName: e.contactedByName || 'Unknown PA', contactedAt: e.contactedAt })),
  });
});

export const paPerformance = asyncHandler(async (_req, res) => {
  const now = new Date();
  const todayMatch = { status: 'CONTACTED', contactedAt: { $gte: todayStart(now), $lt: tomorrowStart(now) } };
  const monthMatch = { status: 'CONTACTED', contactedAt: { $gte: monthStart(now), $lt: tomorrowStart(now) } };

  const [pas, allTimeAgg, todayAgg, monthAgg] = await Promise.all([
    PA.find({}).sort({ name: 1 }).lean(),
    Enquiry.aggregate([
      { $match: { status: 'CONTACTED', contactedBy: { $ne: null } } },
      { $group: { _id: '$contactedBy', total: { $sum: 1 }, lastActivity: { $max: '$contactedAt' } } },
    ]),
    Enquiry.aggregate([
      { $match: todayMatch },
      { $group: { _id: '$contactedBy', count: { $sum: 1 } } },
    ]),
    Enquiry.aggregate([
      { $match: monthMatch },
      { $group: { _id: '$contactedBy', count: { $sum: 1 } } },
    ]),
  ]);

  const allMap = new Map(allTimeAgg.map((a) => [String(a._id), a]));
  const todayMap = new Map(todayAgg.map((a) => [String(a._id), a.count]));
  const monthMap = new Map(monthAgg.map((a) => [String(a._id), a.count]));

  const performance = pas.map((p) => {
    const pId = String(p._id);
    const all = allMap.get(pId);
    return {
      id: p._id,
      name: p.name,
      username: p.username,
      isActive: p.isActive,
      totalContacted: all?.total || 0,
      contactedToday: todayMap.get(pId) || 0,
      contactedThisMonth: monthMap.get(pId) || 0,
      lastActivity: [all?.lastActivity, p.lastLoginAt].filter(Boolean).sort((a, b) => b - a)[0] || null,
    };
  });

  ok(res, { performance });
});

