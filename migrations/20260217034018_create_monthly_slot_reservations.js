/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  // 1️⃣ Create ENUM for status
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE monthly_reservation_status AS ENUM (
        'active',
        'cancelled',
        'expired'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.schema.createTable('monthly_slot_reservations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.string('sport').notNullable();
    table.string('box').notNullable();

    table.date('start_date').notNullable();
    table.date('end_date').notNullable();

    table.integer('start_time').notNullable();
    table.integer('end_time').notNullable();

    table.string('customer_name');
    table.string('customer_phone');

    table.decimal('amount_paid', 10, 2).defaultTo(0);

    table
      .specificType('status', 'monthly_reservation_status')
      .notNullable()
      .defaultTo('active');

    table.text('notes');

    // Audit fields
    table.string('created_by_type', 20).notNullable().defaultTo('system');
    table.string('created_by_id');

    table.string('last_updated_by_type', 20);
    table.string('last_updated_by_id');

    table.timestamps(true, true);

    // Indexes (important for availability checks)
    table.index(['box', 'start_date', 'end_date']);
    table.index(['status']);
  });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('monthly_slot_reservations');
  await knex.raw(`DROP TYPE IF EXISTS monthly_reservation_status;`);
};
