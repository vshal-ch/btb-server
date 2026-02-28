/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  // 1️⃣ Create ENUM type (if not exists)
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE actor_type AS ENUM ('system', 'user', 'admin');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  const tables = [
    "admins",
    "amenities",
    "booked_slots",
    "costs",
    "faqs",
    "media",
    "notes",
    "offers",
    "offer_conditions",
    "sports",
    "venue",
  ];

  for (const table of tables) {
    await knex.schema.alterTable(table, (t) => {
      t.specificType("created_by_type", "actor_type")
        .notNullable()
        .defaultTo("system");

      t.string("created_by_id");

      t.specificType("last_updated_by_type", "actor_type");
      t.string("last_updated_by_id");
    });
  }

  await knex.schema.alterTable("booked_slots", (t) => {
    t.timestamps(true, true);
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  const tables = [
    "admins",
    "amenities",
    "booked_slots",
    "costs",
    "faqs",
    "media",
    "notes",
    "offers",
    "offer_conditions",
    "sports",
    "venue",
  ];

  for (const table of tables) {
    await knex.schema.alterTable(table, (t) => {
      t.dropColumn("created_by_type");
      t.dropColumn("created_by_id");
      t.dropColumn("last_updated_by_type");
      t.dropColumn("last_updated_by_id");
    });
  }

  // Drop ENUM type
  await knex.raw(`DROP TYPE IF EXISTS actor_type;`);

  await knex.schema.table("booked_slots", function (table) {
    table.dropColumn("created_at");
    table.dropColumn("updated_at");
  });
};
