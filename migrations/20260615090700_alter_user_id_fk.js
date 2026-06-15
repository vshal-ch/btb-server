/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("booked_slots", (table) => {
    table.dropForeign("user_id");

    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");

    table.string("customer_name").defaultTo("").nullable();
  });
  await knex.raw(`
        UPDATE booked_slots
        set customer_name = users.name
        from users
        where booked_slots.user_id = users.id
    `);

  await knex.schema.alterTable("auth_logs", (table) => {
    table.dropForeign("user_id");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("booked_slots", (table) => {
    table.dropForeign("user_id");
    table.dropColumn("customer_name");

    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
  });
  await knex.schema.alterTable("auth_logs", (table) => {
    table.foreign("user_id").references("id").inTable("users");
  });
};
