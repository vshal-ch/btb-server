import db from "../config/db.js";

// Get active slots with blocked = true and end_time > current_time
export async function getSlots(currentTime, date) {
  return db("booked_slots")
    .where("date", date)
    .where("blocked", true)
    .andWhere("end_time", ">", currentTime)
    .select("id","start_time","end_time","date")
    .orderBy("start_time", "asc");
}

export async function createSlot({ start_time, end_time, note, blocked, date }) {
  const existing = await db("booked_slots")
    .where({ start_time, end_time, date })
    .first();

  if (existing) {
    if (existing.blocked === false) {
      await db("booked_slots")
        .where({ id: existing.id })
        .update({ blocked: true });
      return { ...existing, blocked: true };
    }
    throw new Error("Slot already exists and is blocked");
  }

  const [inserted] = await db("booked_slots")
    .insert({
      id: crypto.randomUUID(),
      start_time,
      end_time,
      note,
      blocked: blocked,
      date: date, // yyyy-mm-dd
    })
    .returning("*");

  return inserted;
}

export async function updateSlot(id, slotData, existing) {
  const changes = {};

  ["start_time", "end_time", "note", "blocked", "date"].forEach((field) => {
    if (slotData[field] !== undefined && slotData[field] !== existing[field]) {
      changes[field] = slotData[field];
    }
  });

  if (Object.keys(changes).length === 0) return existing;

  const [updated] = await db("booked_slots")
    .where({ id })
    .update(changes)
    .returning("*");

  return updated;
}

export async function deleteSlot(id) {
  const existing = await db("booked_slots").where({ id }).first();
  if (!existing) throw new Error("Slot not found");

  await db("booked_slots").where({ id }).delete();
  return existing;
}

export function getAllSlots({ all, only_blocked, current_time, date }) {
  let query = db("booked_slots").select("*").orderBy("date", "desc").orderBy("start_time","desc");

  if (!all) {
    query = query.where("end_time", ">", current_time)
	.andWhere("date", ">=", date);
  }

  if (only_blocked === true) {
    query = query.where("blocked", only_blocked);
  }

  return query;
}
