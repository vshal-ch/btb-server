import db from "../config/db.js";

export const getVenueData = async () => {
  const venue = await db("venue")
    .select("name", "address", "gmaps_url", "dimensions", "is_open", "timings")
    .first();
  if (!venue) return null;
  const media = await db("media")
    .select("id", "type", "src_url", "description")
    .orderBy("position", "asc");
  const costs = await db("costs")
    .join("sports", "costs.sport_id", "sports.id")
    .select(
      "costs.id",
      "costs.evening_cost",
      "costs.weekend_cost",
      "costs.cost",
      "sports.name as sport"
    );

  return { ...venue, media, costs };
};

export async function updateVenue(data) {
  const { id, ...fields } = data;

  // Build dynamic update object (ignore undefined / null)
  const updateData = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      updateData[key] = value;
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("No valid fields provided for update");
  }

  const [updated] = await db("venue")
    .where({ id })
    .update(updateData)
    .returning([
      "name",
      "timings",
      "gmaps_url",
      "address",
      "dimensions",
      "is_open",
    ]);

  return updated;
}
