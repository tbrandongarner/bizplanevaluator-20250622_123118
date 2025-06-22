const errorResponseHandler = (err, req, res, next) => {
  // Log error: full stack in development, brief message otherwise
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  } else {
    console.error(err.message);
  }

  let statusCode;
  let message;

  if (err.isJoi && Array.isArray(err.details)) {
    statusCode = 400;
    message = err.details.map(d => d.message).join('. ');
  } else if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join('. ');
  } else if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = `Resource not found with id of ${err.value}`;
  } else if (err.code === 11000 && err.keyValue) {
    statusCode = 400;
    const fields = Object.keys(err.keyValue).join(', ');
    message = `Duplicate field value entered for ${fields}`;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your token has expired. Please log in again.';
  } else {
    statusCode = err.statusCode || 500;
    message = err.message || 'Internal Server Error';
  }

  const responsePayload = {
    success: false,
    error: message
  };
  if (process.env.NODE_ENV === 'development') {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};

const catchAsync = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorResponseHandler,
  catchAsync
};