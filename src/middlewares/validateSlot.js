import db from "../config/db.js";
import validator from "validator";

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
    let { current_time, date } = req.query;
    if (!current_time) {
      return res
        .status(400)
        .json({ success: false, data: {}, error: "current_time is required" });
    }
    if (!isValidDateString(date)) {
      return res
        .status(400)
        .json({ success: false, data: {}, error: "date is required" });
    }
    next();
  } catch (e) {
    next(e);
  }
}

// Middleware for POST /slot
export async function validateNewSlot(req, res, next) {
  try {
    let { start_time, end_time, note, blocked, date } = req.body;

    if (!isValidDateString(date)) {
      return res
        .status(400)
        .json({ success: false, data: {}, error: "Invalid date" });
    }

    if (!validateTimes(start_time, end_time)) {
      return res.status(400).json({
        success: false,
        data: {},
        error: "Invalid start_time or end_time",
      });
    }

    note = sanitizeNote(note);

    // Check overlap
    const overlap = await db("booked_slots")
      .where("date", date)
      .andWhere("blocked", true)
      .andWhere(function () {
        this.where("start_time", "<", end_time).andWhere(
          "end_time",
          ">",
          start_time
        );
      })
      .first();

    if (overlap) {
      return res.status(400).json({
        success: false,
        data: {},
        error: "Slot overlaps with an existing booking",
      });
    }

    req.slotData = { start_time, end_time, note, blocked, date };
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

    let { start_time, end_time, note, blocked, date } = req.body;

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

    if (!validateTimes(newStart, newEnd)) {
      return res.status(400).json({
        success: false,
        data: {},
        error: "Invalid start_time or end_time",
      });
    }

    // Check overlap (excluding self)
    const overlap = await db("booked_slots")
      .where("date", newDate)
      .andWhere("blocked", true)
      .andWhereNot("id", id)
      .andWhere(function () {
        this.where("start_time", "<", newEnd).andWhere(
          "end_time",
          ">",
          newStart
        );
      })
      .first();

    if (overlap) {
      return res
        .status(400)
        .json({
          success: false,
          data: {},
          error: "Updated slot overlaps with an existing booking",
        });
    }

    req.slotData = {
      start_time: newStart,
      end_time: newEnd,
      note: sanitizeNote(note) ?? existing.note,
      blocked: blocked ?? existing.blocked,
      date: newDate,
    };

    req.existing = existing;
    next();
  } catch (err) {
    next(err);
  }
}
