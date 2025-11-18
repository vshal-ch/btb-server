// services/costsService.js
import knex from "../config/db.js";
import createError from "http-errors";

// GET all costs
export async function getAllCosts() {
  return knex("costs")
    .join("sports", "costs.sport_id", "sports.id")
    .select(
      "costs.id",
      "costs.evening_cost",
      "costs.weekend_cost",
      "costs.cost",
      "sports.name as sport"
    );
}

// CREATE cost
export async function createCost({
  evening_cost,
  weekend_cost,
  sport_id,
  cost,
}) {
  const id = crypto.randomUUID();
  const [inserted] = await knex("costs").insert({
    id,
    evening_cost,
    weekend_cost,
    sport_id,
    cost,
  }).returning("*");
  const newCost = await knex("costs")
    .join("sports", "costs.sport_id", "sports.id")
    .select(
      "costs.id",
      "costs.evening_cost",
      "costs.weekend_cost",
      "costs.cost",
      "sports.name as sport"
    )
    .where("costs.id", inserted.id)
    .first();
  return newCost;
}

// UPDATE cost
export async function updateCost(
  id,
  { evening_cost, weekend_cost, sport_id, cost }
) {
  const existing = await knex("costs").where({ id }).first();
  if (!existing) {
    throw createError(404, "Cost not found");
  }

  const [updated] = await knex("costs")
    .where({ id })
    .update({ evening_cost, weekend_cost, sport_id, cost })
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
