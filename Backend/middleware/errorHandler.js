import { ApiError } from '../utils/response.js';

export const notFound = (req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message;
  let errors = err.errors;

  if (err.name === 'ValidationError' && err.errors && !(err instanceof ApiError)) {
    status = 400;
    message = 'Validation failed';
    errors = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Duplicate value';
  } else if (status >= 500) {
    console.error(err);
    message = 'Internal server error';
  }
  res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });
};

