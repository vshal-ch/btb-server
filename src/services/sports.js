import knex from "../config/db.js";
import createError from "http-errors";

export async function getAllSports() {
  return knex("sports").select("*");
}

export async function createSport({ sport }) {
  const id = crypto.randomUUID();
  const [newSport] = await knex("sports")
    .insert({ id, name: sport })
    .returning("*");
  return newSport;
}

export async function updateSport(id, { sport }) {
  const existing = await knex("sports").where({ id }).first();
  if (!existing) {
    throw createError(404, "Sport not found");
  }

  const [updated] = await knex("sports")
    .where({ id })
    .update({ name: sport })
    .returning("*");

  return updated;
}

export async function deleteSport(id) {
  const existing = await knex("sports").where({ id }).first();
  if (!existing) {
    throw createError(404, "Sport not found");
  }
  await knex("sports").where({ id }).del();
  return { success: true };
}
