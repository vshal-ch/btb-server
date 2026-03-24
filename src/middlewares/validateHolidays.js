import validator from "validator";

function isValidDate(date) {

  return validator.isISO8601(date);
}

export function validateIdParam(req, res, next) {
  const { id } = req.params;
  if (!id) {
    return next(createError(400, "Invalid or missing id"));
  }
  next();
}

export function validateCreate(req, res, next) {
  let { date, name, type } = req.body;
  // required
  if (!date || typeof date !== "string" || !isValidDate(date)) {
    return res
      .status(400)
      .json({ success: false, error: "date must be in YYYY-MM-DD format" });
  }

  if (!name || typeof name !== "string" || validator.isEmpty(name.trim())) {
    return res.status(400).json({ success: false, error: "name is required" });
  }

  // optional
  if (type && !["public", "regional", "custom"].includes(type)) {
    return res.status(400).json({ success: false, error: "invalid type" });
  }

  // normalize
  req.body.date = date;
  req.body.name = name.trim();

  next();
}

export function validateUpdate(req, res, next) {
  let { date, name, type } = req.body;

  // require at least one field
  if (date === undefined && name === undefined && type === undefined) {
    return res
      .status(400)
      .json({ success: false, error: "at least one field required" });
  }

  if (date !== undefined) {
    if (typeof date !== "string" || !isValidDate(date)) {
      return res
        .status(400)
        .json({ success: false, error: "date must be in YYYY-MM-DD format" });
    }
  }

  if (name !== undefined) {
    if (typeof name !== "string" || validator.isEmpty(name.trim())) {
      return res.status(400).json({ success: false, error: "invalid name" });
    }
    req.body.name = name.trim();
  }

  if (type !== undefined && !["public", "regional", "custom"].includes(type)) {
    return res.status(400).json({ success: false, error: "invalid type" });
  }

  next();
}
