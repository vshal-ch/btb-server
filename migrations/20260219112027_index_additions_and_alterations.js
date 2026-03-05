/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_booking_id_foreign;
  `);

  await knex.raw(`
    ALTER TABLE booked_slots DROP CONSTRAINT IF EXISTS booked_slots_rescheduled_from_id_foreign;
  `);

  // 2️⃣ Convert child columns first
  await knex.raw(`
    ALTER TABLE payments
    ALTER COLUMN booking_id TYPE uuid
    USING booking_id::uuid;
  `);

  await knex.raw(`
    ALTER TABLE booked_slots
    ALTER COLUMN rescheduled_from_id TYPE uuid
    USING rescheduled_from_id::uuid;
  `);

  // 3️⃣ Convert primary key
  await knex.raw(`
    ALTER TABLE booked_slots
    ALTER COLUMN id TYPE uuid
    USING id::uuid;
  `);

  // 4️⃣ Re-add foreign key constraints
  await knex.raw(`
    ALTER TABLE payments
    ADD CONSTRAINT payments_booking_id_foreign
    FOREIGN KEY (booking_id)
    REFERENCES booked_slots(id)
    ON DELETE CASCADE;
  `);

  await knex.raw(`
    ALTER TABLE booked_slots
    ADD CONSTRAINT booked_slots_rescheduled_from_id_foreign
    FOREIGN KEY (rescheduled_from_id)
    REFERENCES booked_slots(id)
    ON DELETE SET NULL;
  `);

  await knex.schema.alterTable("booked_slots", (t) => {
    t.uuid("user_id").nullable().alter();
    t.uuid("booking_group_id").nullable();
  });

  await knex.raw(`
    UPDATE booked_slots
    SET booking_group_id = id
    WHERE booking_group_id IS NULL;
  `);

  await knex.schema.alterTable("booked_slots", (table) => {
    table.uuid("booking_group_id").notNullable().alter();
  });

  await knex.schema.alterTable("booked_slots", (table) => {
    table.index("booking_group_id");
  });

  await knex.schema.alterTable("payments", (table) => {
    table.uuid("booking_group_id").nullable();
  });

  await knex.raw(`
    UPDATE payments p
    SET booking_group_id = bs.booking_group_id
    FROM booked_slots bs
    WHERE p.booking_id = bs.id;
  `);

  await knex.schema.alterTable("payments", (table) => {
    table.index("booking_group_id");
  });

  await knex.schema.alterTable("payments", (table) => {
    table.uuid("booking_group_id").notNullable().alter();
  });

  await knex.schema.raw(`
   CREATE INDEX idx_booked_slots_user_id ON booked_slots(user_id);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_booking_id_foreign;
  `);

  await knex.raw(`
    ALTER TABLE booked_slots DROP CONSTRAINT IF EXISTS booked_slots_rescheduled_from_id_foreign;
  `);

  await knex.raw(`
    ALTER TABLE payments
    ALTER COLUMN booking_id TYPE varchar
    USING booking_id::text;
  `);

  await knex.raw(`
    ALTER TABLE booked_slots
    ALTER COLUMN rescheduled_from_id TYPE varchar
    USING rescheduled_from_id::text;
  `);

  await knex.raw(`
    ALTER TABLE booked_slots
    ALTER COLUMN id TYPE varchar
    USING id::text;
  `);
  await knex.schema.alterTable("booked_slots", (t) => {
    t.uuid("user_id").nullable().alter();
    table.dropIndex("booking_group_id");
    table.dropColumn("booking_group_id");
  });

  await knex.schema.alterTable("payments", (table) => {
    table.dropIndex("booking_group_id");
    table.dropColumn("booking_group_id");
  });

  await knex.schema.alterTable("booked_slots", (table) => {});
  await knex.schema.raw(`DROP INDEX IF EXISTS idx_booked_slots_user_id`);
};
