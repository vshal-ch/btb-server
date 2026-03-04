import db from "../config/db.js";
import validator from "validator";
import createError from "http-errors";
import getDateString from "../utils/dateFormatter.js";

const ALLOWED_FILTERS = ["all", "future", "past", "attended"];

// helper
function validateTimes(start_time, end_time) {
  const MIN_TIME = 6 * 60; // 6 AM
  const MAX_TIME = 24 * 60; // 12 AM
  return (
    typeof start_time === "number" &&
    typeof end_time === "number" &&
    start_time >= MIN_TIME &&
    end_time <= MAX_TIME &&
    end_time > start_time
  );
}

function isValidDateString(dateStr) {
  if (!dateStr) return falses;
  // must match pattern YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const [year, month, day] = dateStr.split("-").map(Number);

  // months 1–12
  if (month < 1 || month > 12) return false;

  // days per month (handling leap years)
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;

  return true;
}

function sanitizeNote(note) {
  return note ? validator.escape(note.trim()) : null;
}

export async function validateGet(req, res, next) {
  try {
    let { current_time, date, box } = req.query;
    if (current_time && !validator.isNumeric(current_time)) {
      return res
        .status(400)
        .json({ success: false, data: {}, error: "Invalid current time" });
    }
    if (!isValidDateString(date)) {
      return res
        .status(400)
        .json({ success: false, data: {}, error: "date is required" });
    }

    if (!box || (box != "Box-1" && box != "Box-2")) {
      return res
        .status(400)
        .json({ success: false, data: {}, error: "Invalid Box" });
    }
    next();
  } catch (e) {
    next(e);
  }
}

export function validateBookingQuery(req, res, next) {
  let { filter = "all", page = 1, limit = 10 } = req.query;

  if (!ALLOWED_FILTERS.includes(filter)) {
    throw new AppError("Invalid filter value", 400);
  }

  page = Number(page);
  limit = Number(limit);

  if (Number.isNaN(page) || page < 1) {
    throw new AppError("Invalid page number", 400);
  }

  if (Number.isNaN(limit) || limit < 1 || limit > 20) {
    throw new AppError("Invalid limit value", 400);
  }

  req.query.filter = filter;
  req.query.page = page;
  req.query.limit = limit;

  next();
}

export async function validateSelectedSlotBody(req, res, next) {
  const { date, box, sportId, startTime, endTime } = req.body;

  if (
    !date ||
    !box ||
    !sportId ||
    startTime === undefined ||
    endTime === undefined
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ error: "Invalid date format" });
  }

  if (typeof box !== "string" || box.trim().length === 0) {
    return res.status(400).json({ error: "Box must be a non-empty string" });
  }
  // Simple escaping to prevent basic XSS/Injection
  const sanitizedBox = box.replace(/[<>]/g, "");
  if (sanitizedBox !== "Box-1" && sanitizedBox !== "Box-2") {
    return res.status(400).json({ error: "Invalid box" });
  }

  if (!validator.isUUID(sportId)) {
    return res.status(400).json({ error: "sportId must be a valid UUID" });
  }

  const isInvalidTime = (val) => !Number.isInteger(val) || val < 0 || val > 36;

  if (isInvalidTime(startTime) || isInvalidTime(endTime)) {
    return res
      .status(400)
      .json({ error: "Times must be integers between 0 and 36" });
  }

  if (startTime >= endTime) {
    return res.status(400).json({ error: "startTime must be before endTime" });
  }

  if (endTime - startTime < 2) {
    return res.status(400).json({ error: "Minimum booking time is 1 hour" });
  }

  req.body.box = sanitizedBox;

  next();
}

export async function validateReschedule(req, res, next) {
  const { bookingId, date, startTime, endTime } = req.body;
  if (!date || !bookingId || startTime === undefined || endTime === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    return res.status(400).json({ error: "Invalid date format" });
  }

  if (!validator.isUUID(bookingId)) {
    return res.status(400).json({ error: "bookingId must be a valid UUID" });
  }

  const isInvalidTime = (val) => !Number.isInteger(val) || val < 0 || val > 36;

  if (isInvalidTime(startTime) || isInvalidTime(endTime)) {
    return res
      .status(400)
      .json({ error: "Times must be integers between 0 and 36" });
  }

  if (startTime >= endTime) {
    return res.status(400).json({ error: "startTime must be before endTime" });
  }

  if (endTime - startTime < 2) {
    return res.status(400).json({ error: "Minimum booking time is 1 hour" });
  }
  next();
}

export async function checkForExisting(req, res, next) {
  const { date, box, sportId, startTime, endTime } = req.body;
  let dTemp = new Date(date);

  const existing = await db("booked_slots")
    .where({
      user_id: req.user.id,
      box,
      date: getDateString(dTemp),
      start_time: startTime,
      end_time: endTime,
      status: "LOCKED",
    })
    .andWhere("lock_expires_at", ">=", db.fn.now())
    .first();

  if (existing) {
    console.log(
      "A locked slot is available for this user, returning the same.",
    );

    const payment = await db("payments")
      .where({ booking_id: existing.id })
      .first();

    return res.json({
      booking_id: existing.id,
      internal_order_id: payment.internal_order_id,
      gateway_order_id: payment.gateway_order_id,
      payment_session_id: payment.payment_session_id,
      expires_at: existing.lock_expires_at,
    });
  }
  next();
}

// Middleware for POST /slot
export async function validateNewSlot(req, res, next) {
  try {
    let { start_time, end_time, note, status, date, sport_id, total_amount } =
      req.body;

    if (!isValidDateString(date)) {
      return res
        .status(400)
        .json({ success: false, data: {}, error: "Invalid date" });
    }
    const isInvalidTime = (val) =>
      !Number.isInteger(val) || val < 0 || val > 36;

    if (isInvalidTime(start_time) || isInvalidTime(end_time)) {
      return res
        .status(400)
        .json({ error: "Times must be integers between 0 and 36" });
    }

    if (start_time >= end_time) {
      return res
        .status(400)
        .json({ error: "start_time must be before end_time" });
    }

    if (end_time - start_time < 2) {
      return res.status(400).json({ error: "Minimum booking time is 1 hour" });
    }

    if (total_amount && isNaN(total_amount)) {
      return res.status(400).json({
        success: false,
        data: {},
        error: "Invalid amount paid",
      });
    }

    if (status !== "CONFIRMED" && status !== "UNCONFIRMED") {
      return res.status(400).json({
        success: false,
        data: {},
        error: "Invalid status, only CONFIRMED & UNCONFIRMED are allowed.",
      });
    }

    if (!sport_id || typeof sport_id !== "string") {
      return next(
        createError(400, "sport_id is required and must be a string"),
      );
    }

    const sport = await db("sports")
      .select("name", "box")
      .where("id", sport_id);
    if (sport.length == 0) {
      return next(createError(400, "Sport not found with id: " + sport_id));
    }

    note = sanitizeNote(note);

    req.slotData = {
      start_time,
      end_time,
      note,
      date,
      status,
      total_amount,
      sport: sport[0]["name"],
      box: sport[0]["box"],
    };
    next();
  } catch (err) {
    next(err);
  }
}

// Middleware for PUT /slot?id
export async function validateUpdatedSlot(req, res, next) {
  try {
    const id = req.params.id;
    if (!id)
      return res
        .status(400)
        .json({ success: false, data: {}, error: "id is required" });

    const existing = await db("booked_slots").where({ id }).first();
    if (!existing)
      return res
        .status(404)
        .json({ success: false, data: {}, error: "Slot not found" });

    if (existing.created_by_type === "user") {
      return res.status(404).json({
        success: false,
        data: {},
        error: "Slot created by user cannot be modified.",
      });
    }

    let { start_time, end_time, note, status, date, sport_id, total_amount } =
      req.body;

    if (date) {
      if (!isValidDateString(date)) {
        return res
          .status(400)
          .json({ success: false, data: {}, error: "Invalid date" });
      }
    }

    const newStart = start_time ?? existing.start_time;
    const newEnd = end_time ?? existing.end_time;
    const newDate = date ?? existing.date;
    total_amount = total_amount ?? existing.total_amount;
    status = status ?? existing.status;

    const isInvalidTime = (val) =>
      !Number.isInteger(val) || val < 0 || val > 36;

    if (isInvalidTime(newStart) || isInvalidTime(newEnd)) {
      return res
        .status(400)
        .json({ error: "Times must be integers between 0 and 36" });
    }

    if (newStart >= newEnd) {
      return res
        .status(400)
        .json({ error: "Start time must be before newEnd" });
    }

    if (newEnd - newStart < 2) {
      return res.status(400).json({ error: "Minimum booking time is 1 hour" });
    }

    if (total_amount && isNaN(total_amount)) {
      return res.status(400).json({
        success: false,
        data: {},
        error: "Invalid amount paid",
      });
    }

    if (status !== "CONFIRMED" && status !== "UNCONFIRMED") {
      return res.status(400).json({
        success: false,
        data: {},
        error: "Invalid status, only CONFIRMED & UNCONFIRMED are allowed.",
      });
    }
    // Check overlap (excluding self)
    // const overlap = await db("booked_slots")
    //   .where("date", newDate)
    //   .andWhere("blocked", true)
    //   .andWhereNot("id", id)
    //   .andWhere(function () {
    //     this.where("start_time", "<", newEnd).andWhere(
    //       "end_time",
    //       ">",
    //       newStart,
    //     );
    //   })
    //   .first();

    // if (overlap) {
    //   return res.status(400).json({
    //     success: false,
    //     data: {},
    //     error: "Updated slot overlaps with an existing booking",
    //   });
    // }
    if (!sport_id || typeof sport_id !== "string") {
      return next(
        createError(400, "sport_id is required and must be a string"),
      );
    }

    const sport = await db("sports")
      .select("name", "box")
      .where("id", sport_id);
    if (sport.length == 0) {
      return next(createError(400, "Sport not found with id: " + sport_id));
    }

    note = sanitizeNote(note);

    if (sport.length == 0) {
      return next(createError(400, "Sport not found with id: " + sport_id));
    }

    req.slotData = {
      start_time: newStart,
      end_time: newEnd,
      note: sanitizeNote(note) ?? existing.note,
      date: newDate,
      total_amount,
      status,
      sport: sport[0]["name"],
      box: sport[0]["box"],
    };

    req.existing = existing;
    next();
  } catch (err) {
    next(err);
  }
}
