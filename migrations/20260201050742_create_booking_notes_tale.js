exports.up = async function (knex) {
  await knex.schema.createTable("notes", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));

    // Content
    table.text("title").notNullable(); // e.g. "Please note"
    table.text("note").notNullable(); // actual disclaimer text

    // Behaviour
    table.integer("priority").notNullable().defaultTo(0); // lower = higher priority

    table
      .enu("type", ["info", "warning", "important", "policy"], {
        useNative: true,
        enumName: "note_type",
      })
      .notNullable()
      .defaultTo("info");

    table.boolean("is_active").notNullable().defaultTo(true);

    table.timestamps(true, true);
  });
  await knex.raw(`
    CREATE INDEX notes_active_global_idx
    ON notes (priority,title,type)
    WHERE is_active = true
  `);
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("notes");
  await knex.raw(`DROP INDEX IF EXISTS notes_active_global_idx`);
  await knex.raw(`DROP TYPE IF EXISTS note_type`);
};
