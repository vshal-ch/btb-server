/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("venue", (table) => {
    table.string("id").primary(); // custom string id (set from server)
    table.string("name").notNullable();
    table.string("gmaps_url");
    table.text("address");
    table.string("dimensions");
    table.boolean("is_open").defaultTo(true);
  });

  await knex.schema.createTable("media", (table) => {
    table.string("id").primary(); // string id from server
    table.string("src_url").notNullable();
    table.text("description");
    table.timestamp("timestamp").defaultTo(knex.fn.now());
    table.enu("type", ["video", "image"]).notNullable();
    table.integer("position").defaultTo(0);
    // no venue_id, since only one venue
  });

  await knex.schema.createTable("contacts", (table) => {
    table.string("id").primary();
    table.string("name").notNullable();
    table.string("email");
  });

  await knex.schema.createTable("phones", (table) => {
    table.string("id").primary();
    table.string("phone_no").notNullable();
    table.enu("type", ["tel", "whatsapp"]).notNullable();
    table
      .string("contact_id")
      .references("id")
      .inTable("contacts")
      .onDelete("CASCADE");
  });

  await knex.schema.createTable("costs", (table) => {
    table.string("id").primary();
    table.string("timings").notNullable();
    table.decimal("cost", 10, 2).notNullable();
    // no venue_id, since only one venue
  });

  await knex.schema.createTable("booked_slots", (table) => {
    table.string("id").primary();
    table.integer("start_time").notNullable().index();
    table.integer("end_time").notNullable().index();
    table.text("note");
    table.boolean("blocked").defaultTo(true);
    table.date("date").notNullable();
    // no venue_id, since only one venue
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("booked_slots");
  await knex.schema.dropTableIfExists("costs");
  await knex.schema.dropTableIfExists("phones");
  await knex.schema.dropTableIfExists("contacts");
  await knex.schema.dropTableIfExists("media");
  await knex.schema.dropTableIfExists("venue");
};
