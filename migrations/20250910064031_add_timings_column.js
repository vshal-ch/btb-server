/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("venue", (table) => {
    table.string("timings"); // add timings column
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("venue", (table) => {
    table.dropColumn("timings"); // rollback by removing timings column
  });
};
