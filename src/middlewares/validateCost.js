import createError from "http-errors";

// ID param validation
export function validateIdParam(req, res, next) {
  const { id } = req.params;
  if (!id) {
    return next(createError(400, "Invalid or missing id"));
  }
  next();
}

// Cost validation
export function validateCost(req, res, next) {
  const { timings, cost } = req.body;

  if (!timings || typeof timings !== "string") {
    return next(createError(400, "timings is required and must be a string"));
  }

  if (cost === undefined || isNaN(Number(cost))) {
    return next(createError(400, "cost is required and must be a number"));
  }

  // Basic SQL injection prevention
  const forbidden = /(;|--|\/\*|\*\/)/;
  if (forbidden.test(timings)) {
    return next(createError(400, "Invalid characters in timings"));
  }

  next();
}
