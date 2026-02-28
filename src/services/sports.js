import knex from "../config/db.js";
import createError from "http-errors";

export async function getAllSports() {
  return knex("sports").select("*");
}

export async function getAllSportsWithCosts() {
  return knex("sports")
    .join("costs", "sports.id", "costs.sport_id")
    .select(
      "costs.evening_cost",
      "costs.weekend_cost",
      "costs.cost",
      "sports.id ",
      "sports.name as sport",
      "sports.box as box",
    );
}

export async function createSport(
  { sport, box, cost, evening_cost, weekend_cost },
  adminId,
) {
  const id = crypto.randomUUID();
  return await knex.transaction(async (trx) => {
    const [newSport] = await trx("sports")
      .insert({
        id,
        name: sport,
        box: box,
        created_by_type: "admin",
        created_by_id: adminId,
      })
      .returning("*");

    const [inserted] = await trx("costs")
      .insert({
        id: crypto.randomUUID(),
        sport_id: id,
        evening_cost,
        weekend_cost,
        cost,
        created_by_type: "admin",
        created_by_id: adminId,
      })
      .returning("*");
    return {
      id: newSport.id,
      sport: newSport.name,
      box: newSport.box,
      cost: inserted.cost,
      evening_cost: inserted.evening_cost,
      weekend_cost: inserted.weekend_cost,
    };
  });
}

export async function updateSport(
  id,
  { sport, box, cost, evening_cost, weekend_cost },
  adminId,
) {
  return await knex.transaction(async (trx) => {
    const existing = await knex("sports")
      .join("costs", "sports.id", "costs.sport_id")
      .where("sports.id", id)
      .first();
    if (!existing) {
      throw createError(404, "Sport not found");
    }

    const [updated] = await knex("sports")
      .where({ id })
      .update({ name: sport, box })
      .returning("*");

    const [updatedCost] = await knex("costs")
      .where({ sport_id: id })
      .update({ evening_cost, weekend_cost, cost })
      .returning("*");

    return {
      id: updated.id,
      sport: updated.name,
      box: updated.box,
      cost: updatedCost.cost,
      evening_cost: updatedCost.evening_cost,
      weekend_cost: updatedCost.weekend_cost,
    };
  });
}

export async function deleteSport(id) {
  const existing = await knex("sports").where({ id }).first();
  if (!existing) {
    throw createError(404, "Sport not found");
  }
  await knex("sports").where({ id }).del();
  return { success: true };
}
