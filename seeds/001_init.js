/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex("venue").del();

  // Insert the single venue
  await knex("venue").insert([
    {
      id: "venue-1",
      name: "Beat The Box",
      gmaps_url: "https://maps.google.com/?q=Beat+The+Box",
      address: "123 Street, City, Country",
      is_open: true,
      timings: "6:00 AM - 12:00 AM",
      about: `About Beat The Box

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
    },
  ]);
};
