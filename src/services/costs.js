import { isHoliday } from "../cache/holidays.js";
import knex from "../config/db.js";
import createError from "http-errors";

export async function getCostBySport(sport_id) {
  return await knex("costs")
    .join("sports", "costs.sport_id", "sports.id")
    .where("sports.id", sport_id)
    .orWhere("sports.name", sport_id)
    .select(
      "costs.id as cost_id",
      "costs.evening_cost",
      "costs.weekend_cost",
      "costs.cost",
      "sports.id as sport_id",
      "sports.name as sport",
      "sports.box as box",
    )
    .first();
}

export async function getCostSportDetailBySport(sport_id) {
  return await knex("costs")
    .join("sports", "costs.sport_id", "sports.id")
    .where("costs.sport_id", sport_id)
    .select(
      "costs.id as cost_id",
      "costs.evening_cost",
      "costs.weekend_cost",
      "costs.cost",
      "sports.id as sport_id",
      "sports.name as sport",
      "sports.box as box",
    )
    .first();
}

// GET all costs
export async function getAllCosts() {
  return knex("costs")
    .join("sports", "costs.sport_id", "sports.id")
    .select(
      "costs.id as cost_id",
      "costs.evening_cost",
      "costs.weekend_cost",
      "costs.cost",
      "sports.id as sport_id",
      "sports.name as sport",
      "sports.box as box",
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
  const [inserted] = await knex("costs")
    .insert({
      id,
      evening_cost,
      weekend_cost,
      sport_id,
      cost,
    })
    .returning("*");
  const newCost = await knex("costs")
    .join("sports", "costs.sport_id", "sports.id")
    .select(
      "costs.id",
      "costs.evening_cost",
      "costs.weekend_cost",
      "costs.cost",
      "sports.name as sport",
    )
    .where("costs.id", inserted.id)
    .first();
  return newCost;
}

// UPDATE cost
export async function updateCost(
  id,
  { evening_cost, weekend_cost, sport_id, cost },
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

export function calculateCostBreakdown(cost, start, end, date) {
  const blocks = end - start;
  const items = [];
  let total = 0;

  const base = (blocks * cost.cost) / 2;
  total += base;
  items.push({ label: "Base price", amount: base });

  // Evening surcharge
  if (start >= 24) {
    const evening = (blocks * cost.evening_cost) / 2;
    total += evening;
    items.push({ label: "Evening surcharge", amount: evening });
  } else if (end > 24) {
    const evening = ((end - 24) * cost.evening_cost) / 2;
    total += evening;
    items.push({ label: "Evening surcharge", amount: evening });
  }

  // Weekend surcharge
  if (date.getDay() == 6 || date.getDay() == 0) {
    const weekend = (blocks * cost.weekend_cost) / 2;
    total += weekend;
    items.push({ label: "Weekend surcharge", amount: weekend });
  } else if (isHoliday(date)) {
    const holiday = (blocks * cost.weekend_cost) / 2;
    total += holiday;
    items.push({ label: "Holiday surcharge", amount: holiday });
  }

  return { total, items };
}
