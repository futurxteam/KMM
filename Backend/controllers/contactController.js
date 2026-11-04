import mongoose from 'mongoose';
import Enquiry from '../models/Enquiry.js';
import ContactActivity from '../models/ContactActivity.js';
import PA from '../models/PA.js';
import { ApiError, ok, asyncHandler } from '../utils/response.js';
import { isObjectId, str } from '../utils/validators.js';
import { toAdminDto } from './enquiryController.js';
import { todayStart, tomorrowStart } from '../services/dateRange.js';

const STATUSES = ['NOT_CONTACTED', 'CONTACTED'];
const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : null);

const existingPaSet = async (ids) => {
  const unique = [...new Set(ids.filter(Boolean).map(String))];
  if (!unique.length) return new Set();
  return new Set((await PA.find({ _id: { $in: unique } }).select('_id').lean()).map((p) => String(p._id)));
};

const historyDto = (a, existing) => ({
  id: a._id,
  paId: a.paId,
  paName: a.paName,
  paDeleted: !existing.has(String(a.paId)),
  previousStatus: a.previousStatus,
  newStatus: a.newStatus,
  at: a.createdAt,
});

/**
 * PATCH /pa/enquiries/:id/status  { status }
 * The acting PA is taken from the verified JWT (req.user) - never from the body.
 * The status flip and its audit entry are written in ONE transaction, and the flip is a
 * compare-and-set on the previous status, so concurrent PAs can neither double-apply an action
 * nor leave the audit log out of sync with the current state.
 */
export const changeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) throw new ApiError(400, 'Invalid enquiry id');
  const status = str(req.body?.status);
  if (!STATUSES.includes(status)) {
    throw new ApiError(400, 'Validation failed', { status: 'Status must be CONTACTED or NOT_CONTACTED' });
  }
  const from = status === 'CONTACTED' ? 'NOT_CONTACTED' : 'CONTACTED';
  const pa = req.user;
  const now = new Date();

  let updated = null;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      updated = null;
      const set = status === 'CONTACTED'
        ? { status, contactedBy: pa.id, contactedByName: pa.name, contactedAt: now }
        : { status, contactedBy: null, contactedByName: '', contactedAt: null };
      updated = await Enquiry.findOneAndUpdate({ _id: id, status: from }, { $set: set }, { new: true, session });
      if (!updated) return;
      await ContactActivity.create(
        [{ enquiryId: updated._id, enquiryName: updated.name, course: updated.course, paId: pa.id, paName: pa.name, previousStatus: from, newStatus: status }],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  if (!updated) {
    const current = await Enquiry.findById(id).select('status contactedByName contactedAt').lean();
    if (!current) throw new ApiError(404, 'Enquiry not found');
    const who = current.contactedByName ? ` by ${current.contactedByName}` : '';
    throw new ApiError(
      409,
      current.status === 'CONTACTED'
        ? `This enquiry was already marked as contacted${who}. Refresh to see the latest status.`
        : 'This enquiry is already marked as not contacted. Refresh to see the latest status.'
    );
  }
  const existing = await existingPaSet([updated.contactedBy]);
  ok(res, { enquiry: toAdminDto(updated.toObject(), existing) },
    status === 'CONTACTED' ? 'Marked as contacted' : 'Reverted to not contacted');
});

// Enquiry + full contact history (read-only). Used by Admin and PA.
export const getDetails = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) throw new ApiError(400, 'Invalid enquiry id');
  const enquiry = await Enquiry.findById(req.params.id).lean();
  if (!enquiry) throw new ApiError(404, 'Enquiry not found');
  const history = await ContactActivity.find({ enquiryId: enquiry._id }).sort({ createdAt: -1, _id: -1 }).lean();
  const existing = await existingPaSet([enquiry.contactedBy, ...history.map((h) => h.paId)]);
  ok(res, { enquiry: toAdminDto(enquiry, existing), history: history.map((h) => historyDto(h, existing)) });
});

// PA dashboard: shared-pool figures + the caller's own numbers.
export const dashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const today = { $gte: todayStart(now), $lt: tomorrowStart(now) };
  const [total, contacted, contactedToday, mine, mineToday, recentEnquiries, activity, courses] = await Promise.all([
    Enquiry.countDocuments({}),
    Enquiry.countDocuments({ status: 'CONTACTED' }),
    Enquiry.countDocuments({ status: 'CONTACTED', contactedAt: today }),
    Enquiry.countDocuments({ status: 'CONTACTED', contactedBy: req.user.id }),
    Enquiry.countDocuments({ status: 'CONTACTED', contactedBy: req.user.id, contactedAt: today }),
    Enquiry.find({}).sort({ createdAt: -1 }).limit(8).select('name course status createdAt phone').lean(),
    ContactActivity.find({}).sort({ createdAt: -1, _id: -1 }).limit(8).lean(),
    Enquiry.aggregate([
      { $group: { _id: '$course', count: { $sum: 1 }, contacted: { $sum: { $cond: [{ $eq: ['$status', 'CONTACTED'] }, 1, 0] } } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 12 },
    ]),
  ]);
  ok(res, {
    totals: { total, contacted, notContacted: total - contacted, contactedToday, completionPct: pct(contacted, total) },
    mine: { contacted: mine, contactedToday: mineToday },
    recentEnquiries: recentEnquiries.map((e) => ({ id: e._id, name: e.name, phone: e.phone, course: e.course, status: e.status, createdAt: e.createdAt })),
    recentActivity: activity.map((a) => ({
      id: a._id, student: a.enquiryName, course: a.course, paName: a.paName, action: a.newStatus, at: a.createdAt,
    })),
    courseDistribution: courses.map((c) => ({ course: c._id, count: c.count, contacted: c.contacted })),
  });
});

