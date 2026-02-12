/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("amenities", (table) => {
    table.increments("id").primary();

    table.string("amenity", 32).notNullable();
    table.string("iconUrl");

    table.integer("display_order").notNullable().defaultTo(0);

    table.timestamps(true, true);
  });
  await knex.schema.alterTable("media", (table) => {
    table.string("category").defaultTo("venue").notNullable().index();
  });

  await knex.raw(`CREATE EXTENSION IF NOT EXISTS btree_gist`);
  await knex.schema.alterTable("booked_slots", (table) => {
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("box").notNullable();
    table.string("status").notNullable().defaultTo("CONFIRMED");
    table.integer("total_time").notNullable();
    table.string("game_pass_code").notNullable().unique();
    table
      .string("rescheduled_from_id")
      .references("id")
      .inTable("booked_slots")
      .onDelete("SET NULL");

    table.dropColumn("blocked");
  });

  await knex.raw(`
    ALTER TABLE booked_slots
    ADD CONSTRAINT slots_no_overlap
    EXCLUDE USING gist (
      box WITH =,
      date WITH =,
      int4range(start_time, end_time) WITH &&
    )
    WHERE (status = 'CONFIRMED')
  `);

  await knex.raw(`
    CREATE INDEX idx_slots_box_date_confirmed
    ON booked_slots (box, date)
    WHERE status = 'CONFIRMED';
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTable("amenities");
  await knex.schema.alterTable("media", (table) => {
    table.dropColum("category");
  });
  await knex.raw(`
    DROP INDEX IF EXISTS idx_slots_box_date_confirmed;
  `);
};
