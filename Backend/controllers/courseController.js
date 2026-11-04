import Course, { courseKey, normalizeCourseName } from '../models/Course.js';
import { ApiError, ok, asyncHandler } from '../utils/response.js';
import { isObjectId, str } from '../utils/validators.js';

const toDto = (c) => ({
  id: c._id,
  name: c.name,
  description: c.description,
  isActive: c.isActive,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

// Public: active courses only.
export const listPublic = asyncHandler(async (_req, res) => {
  const courses = await Course.find({ isActive: true }).sort({ name: 1 }).collation({ locale: 'en', strength: 2 });
  ok(res, { courses: courses.map((c) => ({ id: c._id, name: c.name })) });
});

export const list = asyncHandler(async (_req, res) => {
  const courses = await Course.find({}).sort({ name: 1 }).collation({ locale: 'en', strength: 2 });
  ok(res, { courses: courses.map(toDto) });
});

const validate = (body, { partial = false } = {}) => {
  const errors = {};
  const out = {};
  if (!partial || body.name !== undefined) {
    const name = normalizeCourseName(str(body.name));
    if (!name) errors.name = 'Course name is required';
    else if (name.length > 120) errors.name = 'Course name must be at most 120 characters';
    out.name = name;
  }
  if (body.description !== undefined) {
    if (typeof body.description !== 'string') errors.description = 'Invalid description';
    else if (body.description.trim().length > 500) errors.description = 'Description must be at most 500 characters';
    else out.description = body.description.trim();
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') errors.isActive = 'isActive must be true or false';
    else out.isActive = body.isActive;
  }
  if (Object.keys(errors).length) throw new ApiError(400, 'Validation failed', errors);
  return out;
};

const duplicate = () => new ApiError(409, 'A course with this name already exists', { name: 'A course with this name already exists' });

export const create = asyncHandler(async (req, res) => {
  const data = validate(req.body || {});
  try {
    const course = await Course.create(data);
    ok(res, { course: toDto(course) }, 'Course created', 201);
  } catch (err) {
    if (err.code === 11000) throw duplicate();
    throw err;
  }
});

export const update = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) throw new ApiError(400, 'Invalid course id');
  const data = validate(req.body || {}, { partial: true });
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found');
  if (data.name !== undefined && courseKey(data.name) !== courseKey(course.name)) {
    // Renames never touch existing enquiries: they keep their own course-name snapshot.
    course.name = data.name;
  } else if (data.name !== undefined) {
    course.name = data.name; // casing/whitespace-only change
  }
  if (data.description !== undefined) course.description = data.description;
  if (data.isActive !== undefined) course.isActive = data.isActive;
  try {
    await course.save();
  } catch (err) {
    if (err.code === 11000) throw duplicate();
    throw err;
  }
  ok(res, { course: toDto(course) }, 'Course updated');
});

export const remove = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) throw new ApiError(400, 'Invalid course id');
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found');
  ok(res, null, 'Course deleted');
});

