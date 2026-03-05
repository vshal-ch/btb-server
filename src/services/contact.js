// services/contactService.js
import knex from "../config/db.js";

export async function getContacts() {
  return knex("contacts as c")
    .leftJoin("phones as p", "c.id", "p.contact_id")
    .select(
      "c.id",
      "c.name",
      "c.email",
      knex.raw(
        `COALESCE(
        json_agg(
          json_build_object(
            'id', p.id,
            'phone_no', p.phone_no,
            'type', p.type,
            'contact_id', p.contact_id
          )
        ) FILTER (WHERE p.id IS NOT NULL),
        '[]'
      ) as phones`,
      ),
    )
    .groupBy("c.id", "c.name", "c.email");
}

export async function createContact({ name, email }) {
  return await knex.transaction(async (trx) => {
    const contact_id = crypto.randomUUID();
    const [contact] = await trx("contacts")
      .insert({ id: contact_id, name, email })
      .returning("*");

    //    const insertedPhones = [];
    //    for (const ph of phones) {
    //      const phone_id = crypto.randomUUID();
    //      const [phone] = await trx("phones")
    //        .insert({
    //          id: phone_id,
    //          phone_no: ph.phone_no,
    //          type: ph.type,
    //          contact_id: contact.id,
    //        })
    //        .returning("*");
    //      insertedPhones.push(phone);
    //    }

    return { ...contact };
  });
}

export async function updateContact(id, { name, email }) {
  const [updated] = await knex("contacts")
    .where({ id })
    .update({ name, email })
    .returning("*");

  return updated;
}

export async function deleteContact(id) {
  return await knex.transaction(async (trx) => {
    await trx("phones").where({ contact_id: id }).del();
    const [deleted] = await trx("contacts").where({ id }).del().returning("*");
    return deleted;
  });
}
