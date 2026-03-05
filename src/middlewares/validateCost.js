import createError from "http-errors";

// ID param validation
export function validateIdParam(req, res, next) {
  const { id } = req.params;
  if (!id) {
    return next(createError(400, "Invalid or missing id"));
  }
  next();
}

export function validateSportIdParam(req, res, next) {
  const { sport_id } = req.params;
  if (!sport_id) {
    return next(createError(400, "Invalid or missing sport_id"));
  }
  req.sport_id = sport_id;
  next();
}

// Cost validation
export function validateCost(req, res, next) {
  const { evening_cost, weekend_cost, sport_id, cost } = req.body;

  if (!sport_id || typeof sport_id !== "string") {
    return next(createError(400, "sport_id is required and must be a string"));
  }

  if (cost === undefined || isNaN(Number(cost))) {
    return next(createError(400, "cost is required and must be a number"));
  }

  if (weekend_cost && isNaN(Number(weekend_cost))) {
    return next(createError(400, "Weekend cost must be numeric"));
  }

  if (evening_cost && isNaN(Number(evening_cost))) {
    return next(createError(400, "Evening cost must be numeric"));
  }

  next();
}
