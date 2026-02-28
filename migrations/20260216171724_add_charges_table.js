/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable("charges", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.string("title").notNullable();

    table
      .enu("charge_type", ["FIXED", "PERCENT"], {
        useNative: true,
        enumName: "charge_type_enum",
      })
      .notNullable();

    table.decimal("charge_value", 10, 2).notNullable();

    table.boolean("is_active").notNullable().defaultTo(true);

    table.integer("priority").notNullable().defaultTo(1);

    table.timestamp("active_from").notNullable();
    table.timestamp("active_until").notNullable();

    table.timestamps(true, true); // created_at, updated_at
    table
      .specificType("created_by_type", "actor_type")
      .notNullable()
      .defaultTo("system");

    table.string("created_by_id");

    table.specificType("last_updated_by_type", "actor_type");
    table.string("last_updated_by_id");
  });

  // Helpful index for active lookup
  await knex.schema.alterTable("charges", (table) => {
    table.index(["is_active", "active_from", "active_until"]);
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("charges");

  // Optional: drop enum if no longer used
  await knex.raw("DROP TYPE IF EXISTS charge_type_enum");
}
