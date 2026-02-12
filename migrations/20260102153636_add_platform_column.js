/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("user_refresh_tokens", (table) => {
    table.string("platform").notNullable();
  });
  await knex.schema.alterTable("auth_logs", (table) => {
    table.string("platform").notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("user_refresh_tokens", (table) => {
    table.dropColumn("platform");
  });
  await knex.schema.alterTable("auth_logs", (table) => {
    table.dropColumn("platform");
  });
};
