/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable("sports", (table) => {
    table.string("id").primary();
    table.string("name").notNullable();
  });

  const sports = await knex("sports")
    .insert([
      { id: crypto.randomUUID(), name: "Cricket" },
      { id: crypto.randomUUID(), name: "Volleyball" },
      { id: crypto.randomUUID(), name: "Badminton" },
    ])
    .returning("*");

  await knex.schema.alterTable("costs", (table) => {
    table.dropColumn("timings");
    table.integer("evening_cost");
    table.integer("weekend_cost");
    table
      .string("sport_id")
      .references("id")
      .inTable("sports")
      .onDelete("CASCADE");
  });

  await knex("costs").del();
  await knex("costs").insert([
    {
      id: crypto.randomUUID(),
      sport_id: sports[0].id,
      evening_cost: 50,
      weekend_cost: 100,
      cost: 300,
    },
    {
      id: crypto.randomUUID(),
      sport_id: sports[1].id,
      evening_cost: 50,
      weekend_cost: 100,
      cost: 200,
    },
    {
      id: crypto.randomUUID(),
      sport_id: sports[2].id,
      evening_cost: 50,
      weekend_cost: 100,
      cost: 200,
    },
  ]);
  await knex.schema.alterTable("booked_slots", (table) => {
    table.string("sport").notNullable().defaultTo("Cricket");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("costs", (table) => {
    table.dropColumn("sport_id");
    table.dropColumn("weekend_cost");
    table.dropColumn("evening_cost");
    table.string("timings"); // add back the dropped column
  });

  // Drop the 'sports' table
  await knex.schema.dropTableIfExists("sports");

  await knex.schema.alterTable("booked_slots", (table) => {
    table.dropColumn("sport");
  });
};
