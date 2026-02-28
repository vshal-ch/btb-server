import knex from "../config/db.js";
import createError from "http-errors";

export async function getAllAmenities() {
  return knex("amenities")
    .orderBy("display_order", "asc")
    .select("id", "amenity");
}

export async function createAmenity({ amenity }, adminId) {
  const [newAmenity] = await knex("amenities")
    .insert({ amenity, created_by_type: "admin", created_by_id: adminId })
    .returning(["id", "amenity"]);
  console.log(newAmenity);

  return newAmenity;
}

export async function updateAmenity(id, { amenity }, adminid) {
  const existing = await knex("amenities")
    .where({ id })
    .select("amenity")
    .first();
  if (!existing) {
    throw createError(404, "Amenity not found");
  }

  if (existing === amenity) {
    return { id, existing };
  }

  const [updated] = await knex("amenities")
    .where({ id })
    .update({
      amenity,
      last_updated_by_type: "admin",
      last_updated_by_id: adminid,
    })
    .returning(["id", "amenity"]);

  return updated;
}

export async function deleteAmenity(id) {
  const existing = await knex("amenities").where({ id }).first();
  if (!existing) {
    throw createError(404, "Amenity not found");
  }
  await knex("amenities").where({ id }).del();
  return { success: true };
}
