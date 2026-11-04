import PA from '../models/PA.js';
import Enquiry from '../models/Enquiry.js';
import { ApiError, ok, asyncHandler } from '../utils/response.js';
import { isObjectId, paPasswordProblem, str } from '../utils/validators.js';

const USERNAME_RE = /^[a-z0-9._-]{3,30}$/;

const toDto = (pa, stats = {}) => ({
  id: pa._id,
  name: pa.name,
  username: pa.username,
  role: pa.role,
  isActive: pa.isActive,
  createdAt: pa.createdAt,
  updatedAt: pa.updatedAt,
  totalContacted: stats.count || 0,
  lastActivity: [stats.last, pa.lastLoginAt].filter(Boolean).sort((a, b) => b - a)[0] || null,
});

export const list = asyncHandler(async (_req, res) => {
  const [pas, counts] = await Promise.all([
    PA.find({}).sort({ createdAt: -1 }),
    Enquiry.aggregate([
      { $match: { contactedBy: { $ne: null } } },
      { $group: { _id: '$contactedBy', count: { $sum: 1 }, last: { $max: '$contactedAt' } } },
    ]),
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c]));
  ok(res, { pas: pas.map((p) => toDto(p, byId.get(String(p._id)))) });
});

const validateFields = (body, { create }) => {
  const errors = {};
  const out = {};

  if (create || body.name !== undefined) {
    const name = str(body.name);
    if (!name) errors.name = 'Name is required';
    else if (name.length > 100) errors.name = 'Name must be at most 100 characters';
    out.name = name;
  }
  if (create || body.username !== undefined) {
    const username = str(body.username).toLowerCase();
    if (!username) errors.username = 'Username is required';
    else if (!USERNAME_RE.test(username)) errors.username = 'Username must be 3-30 characters: letters, numbers, . _ -';
    out.username = username;
  }
  if (create || (body.password !== undefined && body.password !== '')) {
    const problem = paPasswordProblem(body.password);
    if (problem) errors.password = problem;
    else out.password = body.password;
    if (create && body.confirmPassword !== body.password) errors.confirmPassword = 'Passwords do not match';
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') errors.isActive = 'isActive must be true or false';
    else out.isActive = body.isActive;
  }
  if (Object.keys(errors).length) throw new ApiError(400, 'Validation failed', errors);
  return out;
};

const dupUser = () => new ApiError(409, 'Username already exists', { username: 'Username already exists' });

export const create = asyncHandler(async (req, res) => {
  const data = validateFields(req.body || {}, { create: true });
  try {
    const pa = await PA.create({ name: data.name, username: data.username, password: data.password, isActive: true });
    ok(res, { pa: toDto(pa) }, 'PA account created', 201);
  } catch (err) {
    if (err.code === 11000) throw dupUser();
    throw err;
  }
});

export const update = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) throw new ApiError(400, 'Invalid PA id');
  const data = validateFields(req.body || {}, { create: false });
  const pa = await PA.findById(req.params.id).select('+password');
  if (!pa) throw new ApiError(404, 'PA not found');
  for (const k of ['name', 'username', 'isActive']) if (data[k] !== undefined) pa[k] = data[k];
  if (data.password) pa.password = data.password; // hashed by pre-save hook; only when supplied
  try {
    await pa.save();
  } catch (err) {
    if (err.code === 11000) throw dupUser();
    throw err;
  }
  ok(res, { pa: toDto(pa) }, 'PA account updated');
});

export const remove = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) throw new ApiError(400, 'Invalid PA id');
  const pa = await PA.findById(req.params.id);
  if (!pa) throw new ApiError(404, 'PA not found');
  // Make sure every enquiry this PA handled carries a name snapshot before the account disappears.
  await Enquiry.updateMany(
    { contactedBy: pa._id, $or: [{ contactedByName: '' }, { contactedByName: { $exists: false } }] },
    { $set: { contactedByName: pa.name } }
  );
  await pa.deleteOne();
  ok(res, null, 'PA account deleted');
});

