/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("offers", (table) => {
    table.decimal("max_discount_amount", 10, 2).nullable();

    table
      .enu("apply_on", ["BASE", "RUNNING"], {
        useNative: true,
        enumName: "offer_apply_on_enum",
      })
      .notNullable()
      .defaultTo("RUNNING");
  });
  await knex.schema.alterTable("charges", (table) => {
    table
      .enu("apply_on", ["BASE", "RUNNING"], {
        useNative: true,
        enumName: "charge_apply_on_enum",
      })
      .notNullable()
      .defaultTo("RUNNING");
  });

  // table.integer("usage_limit").nullable();
  // table.integer("used_count").notNullable().defaultTo(0);
  // table.integer("max_uses_per_user").nullable();
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("offers", (table) => {
    table.dropColumn("max_discount_amount");
    table.dropColumn("apply_on");
    // table.dropColumn("usage_limit");
    // table.dropColumn("used_count");
    // table.dropColumn("max_uses_per_user");
  });
  await knex.schema.alterTable("charges", (table) => {
    table.dropColumn("apply_on");
  });
  await knex.raw("DROP TYPE IF EXISTS offer_apply_on_enum");
  await knex.raw("DROP TYPE IF EXISTS charge_apply_on_enum");
};
