// services/costsService.js
import knex from "../config/db.js";
import createError from "http-errors";

// GET all costs
export async function getAllCosts() {
  return knex("costs").select("*");
}

// CREATE cost
export async function createCost({ timings, cost }) {
  const id = crypto.randomUUID();
  const [newCost] = await knex("costs")
    .insert({ id, timings, cost })
    .returning("*");
  return newCost;
}

// UPDATE cost
export async function updateCost(id, { timings, cost }) {
  const existing = await knex("costs").where({ id }).first();
  if (!existing) {
    throw createError(404, "Cost not found");
  }

  const [updated] = await knex("costs")
    .where({ id })
    .update({ timings, cost })
    .returning("*");

  return updated;
}

// DELETE cost
export async function deleteCost(id) {
  const existing = await knex("costs").where({ id }).first();
  if (!existing) {
    throw createError(404, "Cost not found");
  }
  await knex("costs").where({ id }).del();
  return { success: true };
}
