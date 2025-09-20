// services/phoneService.js
import knex from "../config/db.js";

export async function getPhones(contact_id) {
  return knex("phones").where({ contact_id }).select("*");
}

export async function createPhone({ phone_no, type },contact_id) {
  const id = crypto.randomUUID();
  const [inserted] = await knex("phones")
    .insert({ id, contact_id, phone_no, type })
    .returning("*");
  return inserted;
}

export async function updatePhone(id, { phone_no, type }) {
  const [updated] = await knex("phones")
    .where({ id })
    .update({ phone_no, type })
    .returning("*");
  return updated;
}

export async function deletePhone(id) {
  const [deleted] = await knex("phones").where({ id }).del().returning("*");
  return deleted;
}
