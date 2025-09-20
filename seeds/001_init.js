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
      dimensions: "40x20 meters",
      is_open: true,
      timings: "6:00 AM - 12:00 AM",
    },
  ]);
};
