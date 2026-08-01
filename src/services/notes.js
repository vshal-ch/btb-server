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

export async function getActiveOfferText() {
  const rows = await db("notes")
    .select("note")
    .where("title", "Active Offer Text")
    .where("is_active", true)
    .first();

  return rows;
}

export async function setActiveOfferText(note) {
  const existing = await db("notes")
    .select("id")
    .where("title", "Active Offer Text")
    .first();

  if (existing) {
    await db("notes").where("id", existing.id).update({
      note,
      is_active: true,
      updated_at: db.fn.now(),
    });

    return existing.id;
  }

  const [id] = await db("notes").insert({
    title: "Active Offer Text",
    note,
    is_active: true,
  });

  return db("notes")
    .select("note")
    .where("title", "Active Offer Text")
    .where("is_active", true)
    .first();
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
