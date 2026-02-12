/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("venue", (table) => {
    table.dropColumn("dimensions");
    table.text("about").defaultTo(
      `About Beat The Box

Location: Near 6 donkula baavi, Sattenapalli Road, Amaravathi, Palnadu Dt
Timings: Open daily from 6:00 AM to 12:00 AM

Venue Overview
Beat The Box is a premium indoor sports venue designed for comfortable, all-weather play. The facility is ideal for both casual games and competitive sessions, offering a well-maintained and professional playing environment.

⚡ Facilities & Amenities

• Fully netted indoor arenas for uninterrupted gameplay

• High-quality lighting for evening and night matches

• Plastic bats and soft tennis balls provided for box cricket

• Drinks available for purchase at the venue

⚡ Playing Arenas

• Box 1 (75 ft × 40 ft): Suitable for Box Cricket and Volleyball

• Box 2 (30 ft × 50 ft): Dedicated Badminton court

• Enclosed with green sheets to reduce air resistance and improve shuttle control`,
    ).notNullable;
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("venue", (table) => {
    table.dropColumn("about");
    table.string("dimensions").defaultTo("75ft x 40ft");
  });
};
