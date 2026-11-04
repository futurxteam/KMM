import Enquiry from '../models/Enquiry.js';
import Course, { courseKey } from '../models/Course.js';
import PA from '../models/PA.js';
import { ApiError, ok, asyncHandler } from '../utils/response.js';
import { normalizePhone, isValidEmail, str, escapeRegex } from '../utils/validators.js';
import { resolveRange, createdAtMatch } from '../services/dateRange.js';

export const createEnquiry = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const errors = {};

  const name = str(body.name);
  if (!name) errors.name = 'Name is required';
  else if (name.length > 100) errors.name = 'Name is too long';

  const phoneRaw = str(String(body.phone ?? ''));
  const secRaw = str(String(body.secondaryPhone ?? ''));
  const phone = normalizePhone(phoneRaw);
  const secondaryPhone = normalizePhone(secRaw);
  if (!phoneRaw) errors.phone = 'Phone number is required';
  else if (!phone) errors.phone = 'Enter a valid 10-digit Indian mobile number';
  if (!secRaw) errors.secondaryPhone = 'Secondary phone number is required';
  else if (!secondaryPhone) errors.secondaryPhone = 'Enter a valid 10-digit Indian mobile number';

  const courseInput = str(body.course);
  let course = null;
  if (!courseInput) errors.course = 'Course is required';
  else {
    // Must be an ACTIVE course in the database; the canonical name is stored as a snapshot.
    course = await Course.findOne({ nameKey: courseKey(courseInput), isActive: true });
    if (!course) errors.course = 'Please select a valid course';
  }

  const email = str(body.email);
  if (email && !isValidEmail(email)) errors.email = 'Enter a valid email address';

  const notes = str(body.notes);
  if (notes.length > 1000) errors.notes = 'Notes must be at most 1000 characters';

  if (Object.keys(errors).length) throw new ApiError(400, 'Validation failed', errors);

  // Status/contactedBy/contactedAt are never accepted from the client.
  const enquiry = await Enquiry.create({
    name, phone, secondaryPhone, course: course.name, courseId: course._id, email, notes,
  });
  ok(res, { enquiry }, 'Enquiry submitted successfully', 201);
});

export const toAdminDto = (e, existingPaIds) => ({
  id: e._id,
  name: e.name,
  phone: e.phone,
  secondaryPhone: e.secondaryPhone,
  course: e.course,
  email: e.email,
  notes: e.notes,
  status: e.status,
  createdAt: e.createdAt,
  contactedAt: e.contactedAt,
  // Name comes from the immutable snapshot, so history survives PA deletion.
  contactedBy: e.contactedBy
    ? { id: e.contactedBy, name: e.contactedByName || 'Unknown PA', deleted: !existingPaIds.has(String(e.contactedBy)) }
    : null,
});

// Shared (Admin + PA) read-only enquiry listing with server-side search/filter/sort/pagination.
export const listEnquiries = asyncHandler(async (req, res) => {
  const q = req.query || {};
  const filter = { ...createdAtMatch(resolveRange(q)) };

  const search = str(q.search).slice(0, 100);
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    const digits = search.replace(/[\s\-+()]/g, '');
    const or = [{ name: rx }, { email: rx }];
    if (/^\d{3,}$/.test(digits)) {
      const drx = new RegExp(escapeRegex(digits.replace(/^(\+?91|0)(?=\d{10}$)/, '')));
      or.push({ phone: drx }, { secondaryPhone: drx });
    }
    filter.$or = or;
  }
  const course = str(q.course);
  if (course) filter.course = course;
  const status = str(q.status);
  if (status) {
    if (!['NOT_CONTACTED', 'CONTACTED'].includes(status)) throw new ApiError(400, 'Invalid status');
    filter.status = status;
  }

  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 10));
  const sortDir = str(q.sort) === 'asc' ? 1 : -1;

  const [total, rows] = await Promise.all([
    Enquiry.countDocuments(filter),
    Enquiry.find(filter)
      .sort({ createdAt: sortDir, _id: sortDir })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const paIds = [...new Set(rows.filter((r) => r.contactedBy).map((r) => String(r.contactedBy)))];
  const existing = new Set((await PA.find({ _id: { $in: paIds } }).select('_id').lean()).map((p) => String(p._id)));

  ok(res, {
    enquiries: rows.map((r) => toAdminDto(r, existing)),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

// Distinct course names present in enquiries (includes names of deleted/renamed courses) for the filter dropdown.
export const enquiryCourseNames = asyncHandler(async (_req, res) => {
  const names = await Enquiry.distinct('course');
  ok(res, { courses: names.sort((a, b) => a.localeCompare(b)) });
});


export const listAdmin = listEnquiries;

