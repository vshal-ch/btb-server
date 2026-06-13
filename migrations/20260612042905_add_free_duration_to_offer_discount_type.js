/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
        ALTER TYPE discount_type_enum
        ADD VALUE IF NOT EXISTS 'FREE_DURATION';
    `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  //Postgres doesn't support dropping values of enum
  // delete and recreate the enum if required
};
