export async function up(knex) {
  await knex.schema.createTable("booking_price_snapshots", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table
      .uuid("booking_id")
      .notNullable()
      .references("id")
      .inTable("booked_slots")
      .onDelete("CASCADE");

    table.uuid("booking_group_id").notNullable();

    table.decimal("base_amount", 10, 2).notNullable();
    table.decimal("final_amount", 10, 2).notNullable();

    table.string("currency", 10).notNullable().defaultTo("INR");

    table.jsonb("breakdown").notNullable();
    table.jsonb("applied_offers").nullable();

    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("booking_price_snapshots");
}
