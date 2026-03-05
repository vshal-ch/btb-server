import db from "../config/db.js";

export async function getSlotSelectionNotes() {
  const rows = await db("notes")
    .select("title", "note", "type")
    .where("title", "Equipment availability")
    .where("is_active", true)
    .orderBy("priority", "asc");

  return rows;
}

export async function getReschedulePolicies() {
  const rows = await db("notes")
    .select("title", "note", "type")
    .where("title", "Reschedule Policy")
    .where("is_active", true)
    .orderBy("priority", "desc");

  return rows;
}

export async function getCheckoutNotes() {
  const rows = await db("notes")
    .select("title", "note", "type")
    .where("type", "policy")
    .where("is_active", true)
    .orderBy("priority", "asc");
  return rows;
}

export async function getVenuePolicies() {
  const rows = await db("notes")
    .select("title", "note", "type")
    .where("title", "Venue policies")
    .where("is_active", true)
    .orderBy("priority", "asc");

  return rows;
}
