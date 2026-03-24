import db from "../config/db.js";

let holidaySet = new Set();

function normalizeDate(date) {
  return new Date(date).toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function loadHolidays() {
  const rows = await db("holidays").select("date");

  const set = new Set();

  for (const row of rows) {
    set.add(normalizeDate(row.date));
  }

  holidaySet = set;
  console.log("[HOLIDAYS] Cache loaded:", holidaySet.size);
}

export function isHoliday(dateInput) {
  const date = new Date(dateInput);

  const full = normalizeDate(date);

  return holidaySet.has(full);
}

export function getAllCached() {
  return Array.from(holidaySet);
}
