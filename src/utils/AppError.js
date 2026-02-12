export default class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.status = statusCode;
    this.isOperational = true; // Useful to distinguish known errors from hardware/system crashes

    Error.captureStackTrace(this, this.constructor);
  }
}
