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
  const units = end - start;
  const items = [];
  let total = 0;
  let costPerUnit = cost.cost / 2;
  let unitDistribution = { daytime: 0, evening: 0 };
  let evnCostPerUnit = cost.evening_cost / 2;

  //units are number of 30 mins, cost.cost is rupees per hour
  const base = units * costPerUnit;
  total += base;
  items.push({ label: "Base price", amount: base });

  // Evening surcharge
  if (start >= 24) {
    const evening = units * evnCostPerUnit;
    total += evening;
    items.push({ label: "Evening surcharge", amount: evening });
    unitDistribution.evening = units;
  } else if (end > 24) {
    const noOfEvnUnits = end - 24;
    const evening = noOfEvnUnits * evnCostPerUnit;
    total += evening;
    items.push({ label: "Evening surcharge", amount: evening });
    unitDistribution.evening = noOfEvnUnits;
  }

  unitDistribution.daytime = units - unitDistribution.evening;

  // Weekend surcharge
  const weekendCostPerUnit = cost.weekend_cost / 2;
  if (date.getDay() == 6 || date.getDay() == 0 || isHoliday(date)) {
    const amount = units * weekendCostPerUnit;
    total += amount;
    const label =
      date.getDay() == 6 || date.getDay() == 0
        ? "Weekend surcharge"
        : "Holiday surcharge";
    items.push({ label, amount });
    costPerUnit += weekendCostPerUnit;
  }

  return { unitDistribution, costPerUnit, evnCostPerUnit, total, items };
}
