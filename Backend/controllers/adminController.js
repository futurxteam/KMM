import { ok } from '../utils/response.js';

export const ping = (req, res) => ok(res, { user: req.user }, 'Admin access granted');

