/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("admin_refresh_tokens", (table) => {
    table.increments("id").primary();
    table
      .integer("admin_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("admins")
      .onDelete("CASCADE");
    table.string("token").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("refresh_tokens");
};
