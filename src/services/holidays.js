import { loadHolidays } from "../cache/holidays.js";
import db from "../config/db.js";

export async function createHoliday(data, admin_id) {
  const [holiday] = await db("holidays")
    .insert({
      ...data,
      created_by_type: "admin",
      created_by_id: admin_id,
    })
    .returning("*");

  await loadHolidays(); // refresh cache
  return holiday;
}

export async function getHolidays() {
  return db("holidays").select("*").orderBy("date");
}

export async function updateHoliday(id, data, admin_id) {
  const [holiday] = await db("holidays")
    .where({ id })
    .update({ ...data, last_updated_by_type: "admin", last_updated_by_id: admin_id })
    .returning("*");

  await loadHolidays();
  return holiday;
}

export async function deleteHoliday(id) {
  await db("holidays").where({ id }).del();
  await loadHolidays();
}