/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.string("email").notNullable().unique();
    table.string("name");
    table.string("phone_no")
    table.text("avatar_url");

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("last_login_at");
  });

  await knex.schema.createTable("oauth_accounts", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    table.string("provider").notNullable(); // 'google'
    table.string("provider_user_id").notNullable(); // Google "sub"

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.unique(["provider", "provider_user_id"]);
  });

  await knex.schema.createTable("user_refresh_tokens", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    table.string("token").notNullable().unique();
    table.timestamp("expires_at").notNullable();

    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("auth_logs", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    table.uuid("user_id").references("id").inTable("users");
    table.string("event").notNullable(); // LOGIN, LOGOUT
    table.string("ip_address");
    table.string("user_agent");

    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    await knex.schema.dropTableIfExists("users");
    await knex.schema.dropTableIfExists("oauth_accounts");
    await knex.schema.dropTableIfExists("user_refresh_tokens");
    await knex.schema.dropTableIfExists("auth_logs");
};
