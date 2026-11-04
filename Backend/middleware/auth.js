import { verifyToken } from '../services/tokenService.js';
import PA from '../models/PA.js';
import Admin from '../models/Admin.js';
import { ApiError, asyncHandler } from '../utils/response.js';
import { isObjectId } from '../utils/validators.js';

export const ROLES = Object.freeze({ ADMIN: 'ADMIN', PA: 'PA' });

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Authentication required');

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    throw new ApiError(401, err.name === 'TokenExpiredError' ? 'Session expired, please log in again' : 'Invalid token');
  }
  if (!isObjectId(decoded.sub)) throw new ApiError(401, 'Invalid token');

  // Role comes from the signed token and the account is re-checked against the database on every request.
  if (decoded.role === ROLES.ADMIN) {
    const admin = await Admin.findById(decoded.sub);
    if (!admin || !admin.isActive) throw new ApiError(401, 'Account not found or deactivated');
    req.user = { id: admin._id.toString(), name: admin.name, username: admin.email, email: admin.email, role: ROLES.ADMIN };
  } else if (decoded.role === ROLES.PA) {
    const pa = await PA.findById(decoded.sub);
    if (!pa || !pa.isActive) throw new ApiError(401, 'Account not found or deactivated');
    req.user = { id: pa._id.toString(), name: pa.name, username: pa.username, role: ROLES.PA };
  } else {
    throw new ApiError(401, 'Invalid token');
  }
  next();
});

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to access this resource'));
  }
  next();
};
