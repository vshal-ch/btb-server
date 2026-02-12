exports.up = function (knex) {
  return knex.schema.createTable("faqs", (table) => {
    table.increments("id").primary();

    table.string("question", 500).notNullable();
    table.text("answer").notNullable();

    table
      .enu("platform", ["all", "android", "web"], {
        useNative: true,
        enumName: "faq_platform_enum",
      })
      .notNullable()
      .defaultTo("all");

    table.integer("display_order").notNullable().defaultTo(0);
    table.boolean("active").notNullable().defaultTo(true);

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("faqs")
    .then(() => knex.raw("DROP TYPE IF EXISTS faq_platform_enum"));
};
