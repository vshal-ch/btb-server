import validator from "validator";
import db from "../config/db.js";

const { isAlphanumeric, isEmpty, isNumeric, isDate } = validator;

export default async function validateReservation(req, res, next) {
  let {
    sport_id,
    amount_paid,
    notes,
    start_date,
    end_date,
    start_time,
    end_time,
    customer_name,
    customer_phone,
    status,
  } = req.body;

  if (!start_date || !end_date) {
    return res.status(400).json({
      success: false,
      error: "Start date and end date are required",
    });
  }

  if (!isDate(start_date) || !isDate(end_date)) {
    return res.status(400).json({
      success: false,
      error: "Invalid start date or end date ",
    });
  }

  if (new Date(start_date) > new Date(end_date)) {
    return res.status(400).json({
      success: false,
      error: "Start date must be before end date",
    });
  }

  if (!validator.isUUID(sport_id)) {
    return res.status(400).json({ error: "sportId must be a valid UUID" });
  }

  const isInvalidTime = (val) => !Number.isInteger(val) || val < 0 || val > 36;

  if (isInvalidTime(start_time) || isInvalidTime(end_time)) {
    return res.status(400).json({ error: "Invalid time input" });
  }

  if (start_time >= end_time) {
    return res.status(400).json({
      success: false,
      error: "Start time must be earlier than end time",
    });
  }

  if (start_time < 0 || end_time > 36) {
    return res.status(400).json({
      success: false,
      error: "Time must be between 6 AM and 12 AM",
    });
  }

  if (!sport_id || typeof sport_id !== "string") {
    return next(createError(400, "sport_id is required and must be a string"));
  }

  const sport = await db("sports").select("name", "box").where("id", sport_id);
  if (sport.length == 0) {
    return next(createError(400, "Sport not found with id: " + sport_id));
  }

  if (!customer_name || !isAlphanumeric(customer_name)) {
    return res.status(400).json({
      success: false,
      error: "Customer name is not present or invalid",
    });
  }

  if (!amount_paid || typeof amount_paid !== "number") {
    return res.status(400).json({
      success: false,
      error: "Amount paid is not present or invalid",
    });
  }

  notes = notes ? validator.escape(notes.trim()) : notes;

  if (!customer_phone || !isNumeric(customer_phone)) {
    return res.status(400).json({
      success: false,
      error: "Customer phone is not present or invalid",
    });
  }
  req.payload = {
    sport: sport[0]["name"],
    box: sport[0]["box"],
    amount_paid,
    notes,
    start_date,
    end_date,
    start_time,
    end_time,
    customer_name,
    customer_phone,
    status,
  };
  next();
}
