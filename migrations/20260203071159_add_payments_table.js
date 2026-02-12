/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("payments", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table
      .string("booking_id", 255)
      .notNullable()
      .references("id")
      .inTable("booked_slots")
      .onDelete("CASCADE");

    table.enu("gateway", ["CASHFREE"]).notNullable();

    table.string("internal_order_id", 64).notNullable().unique();
    table.string("gateway_order_id", 64).notNullable().unique();
    table.text("payment_session_id").notNullable();
    table.decimal("amount", 10, 2).notNullable();
    table.string("currency", 3).defaultTo("INR");

    table
      .enu("status", [
        "CREATED",
        "PENDING",
        "SUCCESS",
        "FAILED",
        "EXPIRED",
        "REFUND_INITIATED",
        "REFUNDED",
      ])
      .notNullable()
      .defaultTo("CREATED");

    table.string("gateway_payment_id", 64);
    table.text("failure_reason");
    table.timestamps(true, true);
  });

  await knex.schema.raw(`
    CREATE INDEX idx_payments_booking_id ON payments (booking_id);
    CREATE INDEX idx_payments_status ON payments (status);
  `);

  await knex.schema.createTable("payment_events", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table
      .uuid("payment_id")
      .references("id")
      .inTable("payments")
      .onDelete("SET NULL");

    table.string("event_id", 128).notNullable().unique();
    table.string("event_type", 64).notNullable();

    table.jsonb("payload").notNullable();

    table.timestamp("received_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("refunds", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table
      .uuid("payment_id")
      .notNullable()
      .references("id")
      .inTable("payments")
      .onDelete("CASCADE");

    table.decimal("amount", 10, 2).notNullable();
    table.text("reason");

    table
      .enu("status", ["REFUND_INITIATED", "REFUNDED", "FAILED"])
      .notNullable();

    table.string("gateway_refund_id", 64);

    table.timestamps(true, true);
  });

  await knex.schema.alterTable("booked_slots", (table) => {
    table.timestamp("lock_expires_at", { useTz: true }).nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("payments");
  await knex.schema.dropTableIfExists("payment_events");
  await knex.schema.dropTableIfExists("refunds");
  await knex.schema.alterTable("booked_slots", (table) => {
    table.dropColumn("lock_expires_at");
  });
};
