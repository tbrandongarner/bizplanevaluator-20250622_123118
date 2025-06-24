class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class ServiceError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ServiceError';
    this.details = details;
  }
}

module.exports = {
  ValidationError,
  ServiceError
};
