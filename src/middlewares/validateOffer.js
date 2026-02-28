import AppError from "../utils/AppError.js";

import validator from "validator";

export const validateOffer = (req, res, next) => {
  const {
    title,
    description,
    discount_type,
    discount_value,
    active_from,
    active_until,
    priority,
    is_active,
    is_stackable,
    max_discount_amount,
    apply_on,
    conditions = [],
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

  if (!discount_type) {
    return res.status(400).json({
      success: false,
      error: "Discount type is required",
    });
  }

  if (discount_value === undefined || discount_value === null) {
    return res.status(400).json({
      success: false,
      error: "Discount value is required",
    });
  }

  if (!apply_on) {
    return res.status(400).json({
      success: false,
      error: "Apply on is required",
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
  const normalizedDescription = description
    ? validator.escape(description.trim())
    : null;

  const discount = Number(discount_value);
  const normalizedPriority = Number(priority);
  const normalizedActiveFrom = new Date(active_from);
  const normalizedActiveUntil = new Date(active_until);
  const normalizedMaxDiscountAmount = max_discount_amount
    ? Number(max_discount_amount)
    : max_discount_amount;

  /* ===============================
     BUSINESS LOGIC VALIDATIONS
  =============================== */

  // Discount validation
  if (isNaN(discount) || discount <= 0) {
    return res.status(400).json({
      success: false,
      error: "Discount value must be greater than 0",
    });
  }

  if (
    normalizedMaxDiscountAmount &&
    (isNaN(normalizedMaxDiscountAmount) || normalizedMaxDiscountAmount <= 0)
  ) {
    return res.status(400).json({
      success: false,
      error: "Max discount amount value must be greater than 0",
    });
  }

  if (discount_type === "PERCENT" && discount > 100) {
    return res.status(400).json({
      success: false,
      error: "Percentage discount cannot exceed 100%",
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

  // Optional: prevent expired offers on creation
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

  if (is_stackable !== undefined && typeof is_stackable !== "boolean") {
    return res.status(400).json({
      success: false,
      error: "is_stackable must be boolean",
    });
  }

  /* ===============================
     CONDITIONS VALIDATION
  =============================== */

  if (!Array.isArray(conditions)) {
    return res.status(400).json({
      success: false,
      error: "Conditions must be an array",
    });
  }

  for (let i = 0; i < conditions.length; i++) {
    const cond = conditions[i];

    if (!cond.condition_type || !cond.operator || !cond.value) {
      return res.status(400).json({
        success: false,
        error: `Condition ${i + 1} is incomplete`,
      });
    }
  }

  /* ===============================
     SAFE PAYLOAD CONSTRUCTION
  =============================== */

  req.offerPayload = {
    title: normalizedTitle,
    description: normalizedDescription,
    discount_type,
    discount_value: discount,
    active_from: normalizedActiveFrom,
    active_until: normalizedActiveUntil,
    priority: normalizedPriority,
    is_active: is_active ?? true,
    is_stackable: is_stackable ?? false,
    conditions,
    max_discount_amount: normalizedMaxDiscountAmount,
    apply_on,
  };

  next();
};
