exports.up = async function (knex) {
  await knex.schema.createTable("offers", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.string("title").notNullable();
    table.text("description");

    table
      .enu("discount_type", ["FLAT", "PERCENT"], {
        useNative: true,
        enumName: "discount_type_enum",
      })
      .notNullable();

    table.decimal("discount_value", 10, 2).notNullable();

    table.timestamp("active_from", { useTz: true }).notNullable();
    table.timestamp("active_until", { useTz: true }).notNullable();

    table.boolean("is_active").defaultTo(true);

    table.integer("priority").notNullable().defaultTo(100);

    table.boolean("is_stackable").notNullable().defaultTo(false);
    table.timestamps(true, true);
  });

  await knex.schema.createTable("offer_conditions", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table
      .uuid("offer_id")
      .references("id")
      .inTable("offers")
      .onDelete("CASCADE");

    table
      .enu(
        "condition_type",
        ["MIN_DURATION", "SPORT", "BOX", "DAY_OF_WEEK", "TIME_RANGE"],
        {
          useNative: true,
          enumName: "offer_condition_type_enum",
        },
      )
      .notNullable();

    table
      .enu("operator", ["=", ">=", "<=", "IN"], {
        useNative: true,
        enumName: "offer_condition_operator_enum",
      })
      .notNullable();

    table.text("value").notNullable();

    table.timestamps(true, true);
  });

  // indexes
  await knex.schema.raw(`
    CREATE INDEX offers_active_idx
    ON offers (active_from, active_until)
    WHERE is_active = true
  `);

  await knex.schema.raw(`
    CREATE INDEX offers_priority_active_idx
    ON offers (priority)
    WHERE is_active = true
  `);

  await knex.schema.raw(`
    CREATE INDEX offer_conditions_offer_idx
    ON offer_conditions (offer_id)
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("offer_conditions");
  await knex.schema.dropTableIfExists("offers");

  await knex.schema.raw(`DROP TYPE IF EXISTS discount_type_enum`);
  await knex.schema.raw(`DROP TYPE IF EXISTS offer_condition_type_enum`);
  await knex.schema.raw(`DROP TYPE IF EXISTS offer_condition_operator_enum`);
  await knex.schema.raw(`DROP INDEX IF EXISTS offers_priority_active_idx`);
  await knex.schema.raw(`DROP INDEX IF EXISTS offer_conditions_offer_idx`);
  await knex.schema.raw(`DROP INDEX IF EXISTS offers_active_idx`);
};
