/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("holidays", function (table) {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.date("date").notNullable().unique(); // YYYY-MM-DD
    table.string("name").notNullable();

    table.string("type").defaultTo("public"); // public, regional, custom

    table.timestamps(true, true); // created_at, updated_at
    table.string("created_by_type", 20).notNullable().defaultTo("system");
    table.string("created_by_id");
    table.string("last_updated_by_type", 20);
    table.string("last_updated_by_id");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("holidays");
};
