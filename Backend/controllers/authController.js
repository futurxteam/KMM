import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import env from '../config/env.js';
import Admin from '../models/Admin.js';
import PA from '../models/PA.js';
import { signToken } from '../services/tokenService.js';
import { ApiError, ok, asyncHandler } from '../utils/response.js';
import { ROLES } from '../middleware/auth.js';
import { isValidEmail, passwordProblem, str } from '../utils/validators.js';

const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

const requireStrings = (body, fields) => {
  const errors = {};
  for (const f of fields) {
    if (typeof body?.[f] !== 'string' || !body[f].trim()) errors[f] = `${f} is required`;
  }
  if (Object.keys(errors).length) throw new ApiError(400, 'Validation failed', errors);
};

const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);

const adminUser = (a) => ({ id: a._id, name: a.name, username: a.email, email: a.email, role: ROLES.ADMIN });

/**
 * One-time bootstrap of the first Admin.
 * Race safety: the Admin schema has a partial UNIQUE index on { isInitialAdmin: true }, so the
 * database allows at most one initial admin. Concurrent requests that pass the existence check
 * collide on that index; the losers get a duplicate-key error which we translate to 403.
 */
export const setupAdmin = asyncHandler(async (req, res) => {
  const provided = req.headers['x-setup-key'];
  if (!env.adminSetupKey) throw new ApiError(403, 'Admin setup is not enabled');
  if (typeof provided !== 'string' || !provided || !safeEqual(provided, env.adminSetupKey)) {
    throw new ApiError(403, 'Invalid or missing setup key');
  }
  if (await Admin.exists({})) throw new ApiError(403, 'Setup already completed');

  const name = str(req.body?.name);
  const email = str(req.body?.email).toLowerCase();
  const password = req.body?.password;
  const errors = {};
  if (!name || name.length > 100) errors.name = 'Name is required (max 100 characters)';
  if (!isValidEmail(email)) errors.email = 'A valid email is required';
  const pwProblem = passwordProblem(password);
  if (pwProblem) errors.password = pwProblem;
  if (Object.keys(errors).length) throw new ApiError(400, 'Validation failed', errors);

  let admin;
  try {
    admin = await Admin.create({ name, email, password, isInitialAdmin: true });
  } catch (err) {
    if (err.code === 11000) throw new ApiError(403, 'Setup already completed');
    throw err;
  }
  ok(res, { admin }, 'Initial admin created', 201);
});

export const adminLogin = asyncHandler(async (req, res) => {
  const identifier = req.body?.email ?? req.body?.username;
  requireStrings({ email: identifier, password: req.body?.password }, ['email', 'password']);
  const email = identifier.trim().toLowerCase();

  const admin = await Admin.findOne({ email }).select('+password');
  const match = await bcrypt.compare(req.body.password, admin ? admin.password : DUMMY_HASH);
  if (!admin || !match) throw new ApiError(401, 'Invalid credentials');
  if (!admin.isActive) throw new ApiError(403, 'This account has been deactivated');

  Admin.updateOne({ _id: admin._id }, { lastLoginAt: new Date() }).catch(() => {});
  const token = signToken({ sub: admin._id.toString(), role: ROLES.ADMIN });
  ok(res, { token, user: adminUser(admin) }, 'Login successful');
});

export const paLogin = asyncHandler(async (req, res) => {
  requireStrings(req.body, ['username', 'password']);
  const username = req.body.username.trim().toLowerCase();
  const pa = await PA.findOne({ username }).select('+password');
  const match = await bcrypt.compare(req.body.password, pa ? pa.password : DUMMY_HASH);
  if (!pa || !match) throw new ApiError(401, 'Invalid credentials');
  if (!pa.isActive) throw new ApiError(403, 'This account has been deactivated');

  PA.updateOne({ _id: pa._id }, { lastLoginAt: new Date() }).catch(() => {});
  const token = signToken({ sub: pa._id.toString(), role: ROLES.PA });
  ok(res, { token, user: { id: pa._id, name: pa.name, username: pa.username, role: ROLES.PA } }, 'Login successful');
});

export const me = (req, res) => ok(res, { user: req.user });

// Stateless JWT: client discards the token.
export const logout = (_req, res) => ok(res, null, 'Logged out');
