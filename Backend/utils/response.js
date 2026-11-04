export class ApiError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export const ok = (res, data = null, message = 'OK', status = 200) =>
  res.status(status).json({ success: true, message, data });

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

