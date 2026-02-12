/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {

  await knex.schema.alterTable("sports", (table) => {
    table.string("box").defaultTo("Box 1").notNullable();
  });
  await knex("sports")
    .where({ name: "Badminton" })
    .update({ box: "Box 2" });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("sports", (table) => {
    table.dropColumn("box");
  });
};
