import validator from "validator";

export const validateCharge = (req, res, next) => {
  const {
    title,
    charge_type,
    charge_value,
    active_from,
    active_until,
    priority,
    is_active,
    apply_on,
  } = req.body;

  /* ===============================
     REQUIRED FIELD VALIDATIONS
  =============================== */

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      error: "Title is required",
    });
  }

  if (!charge_type) {
    return res.status(400).json({
      success: false,
      error: "Charge type is required",
    });
  }

  if (!apply_on) {
    return res.status(400).json({
      success: false,
      error: "Apply on is required",
    });
  }

  if (charge_value === undefined || charge_value === null) {
    return res.status(400).json({
      success: false,
      error: "Charge value is required",
    });
  }

  if (!active_from || !active_until) {
    return res.status(400).json({
      success: false,
      error: "Active from and active until are required",
    });
  }

  if (priority === undefined || priority === null) {
    return res.status(400).json({
      success: false,
      error: "Priority is required",
    });
  }

  /* ===============================
     TYPE NORMALIZATION
  =============================== */

  const normalizedTitle = validator.escape(title.trim());

  const charge = Number(charge_value);
  const normalizedPriority = Number(priority);
  const normalizedActiveFrom = new Date(active_from);
  const normalizedActiveUntil = new Date(active_until);

  /* ===============================
     BUSINESS LOGIC VALIDATIONS
  =============================== */

  // Discount validation
  if (isNaN(charge) || charge < 0) {
    return res.status(400).json({
      success: false,
      error: "Charge value must not be less than 0",
    });
  }

  // Date validation
  if (
    isNaN(normalizedActiveFrom.getTime()) ||
    isNaN(normalizedActiveUntil.getTime())
  ) {
    return res.status(400).json({
      success: false,
      error: "Invalid date format",
    });
  }

  if (normalizedActiveFrom >= normalizedActiveUntil) {
    return res.status(400).json({
      success: false,
      error: "Active until must be after active from",
    });
  }

  // Optional: prevent expired charges on creation
  if (normalizedActiveUntil < new Date()) {
    return res.status(400).json({
      success: false,
      error: "Active until cannot be in the past",
    });
  }

  // Priority validation
  if (isNaN(normalizedPriority) || normalizedPriority < 0) {
    return res.status(400).json({
      success: false,
      error: "Priority must be 0 or greater",
    });
  }

  // Boolean validation
  if (is_active !== undefined && typeof is_active !== "boolean") {
    return res.status(400).json({
      success: false,
      error: "is_active must be boolean",
    });
  }

  /* ===============================
     SAFE PAYLOAD CONSTRUCTION
  =============================== */

  req.chargePayload = {
    title: normalizedTitle,
    charge_type,
    charge_value: charge,
    active_from: normalizedActiveFrom,
    active_until: normalizedActiveUntil,
    priority: normalizedPriority,
    is_active: is_active ?? true,
    apply_on,
  };

  next();
};
