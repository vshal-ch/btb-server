export async function up(knex) {
  await knex.schema.alterTable("booked_slots", (table) => {
    table.decimal("total_amount", 10, 2).nullable();
  });

  await knex.raw(`
    UPDATE booked_slots bs
    SET total_amount = p.amount
    FROM (
      SELECT DISTINCT ON (booking_id)
        booking_id,
        amount
      FROM payments
      WHERE status = 'SUCCESS'
      ORDER BY booking_id, created_at DESC
    ) p
    WHERE bs.id = p.booking_id
  `);

  await knex("booked_slots")
    .whereNull("total_amount")
    .update({ total_amount: 0 });

  await knex.schema.alterTable("booked_slots", (table) => {
    table.decimal("total_amount", 10, 2).notNullable().alter();
  });
}

export async function down(knex) {
  // Rollback: remove the column
  await knex.schema.alterTable("booked_slots", (table) => {
    table.dropColumn("total_amount");
  });
}
