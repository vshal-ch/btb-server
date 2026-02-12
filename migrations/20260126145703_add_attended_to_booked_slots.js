/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("media", (table) => {
    table.boolean("active").notNullable().defaultTo(true);
    table.string("title").notNullable().defaultTo("Beat The Box");
  });
  await knex.schema.alterTable("booked_slots", (table) => {
    table.timestamp("end_at", { useTz: true }).notNullable();

    table.boolean("attended").notNullable().defaultTo(false);
  });
  await knex.raw(`
    CREATE INDEX idx_slots_user_endat_upcoming
    ON booked_slots (user_id, end_at)
    WHERE status = 'CONFIRMED'
      AND attended = false;
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("media", (table) => {
    table.dropColumn("active");
  });
    await knex.raw(`
    DROP INDEX IF EXISTS idx_bookings_user_endat_upcoming;
  `);

  await knex.schema.alterTable("bookings", (table) => {
    table.dropColumn("end_at");
    table.dropColumn("attended");
  });
};
