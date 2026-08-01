/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // await knex.schema.createTable("offer_condition_types", (table) => {
  //   table.increments("id").primary();
  //   table.string("condition_type", 100).notNullable().unique();
  //   table.boolean("is_active").notNullable().defaultTo(true);
  // });
  // await knex.schema.createTable("discount_type_enum ", (table) => {
  //   table.increments("id").primary();
  //   table.string("discount_type", 100).notNullable().unique();
  //   table.boolean("is_active").notNullable().defaultTo(true);
  // });
  // await knex.schema.createTable("offer_condition_operators", (table) => {
  //   table.increments("id").primary();
  //   table.string("operator", 100).notNullable().unique();
  //   table.boolean("is_active").notNullable().defaultTo(true);
  // });
  await knex.raw(`
        ALTER TYPE offer_condition_type_enum
        ADD VALUE IF NOT EXISTS 'END_TIME';
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {};
