import db from "../config/db.js";

// export const getVenueData = async () => {
//   const venue = await db("venue")
//     .select("name", "address", "gmaps_url", "dimensions", "is_open", "timings")
//     .first();
//   if (!venue) return null;
//   const media = await db("media")
//     .select("id", "type", "src_url", "description")
//     .orderBy("position", "asc");
//   const costs = await db("costs")
//     .join("sports", "costs.sport_id", "sports.id")
//     .select(
//       "costs.id",
//       "costs.evening_cost",
//       "costs.weekend_cost",
//       "costs.cost",
//       "sports.name as sport"
//     );

//   return { ...venue, media, costs };
// };

export const getHomeData = async () => {
  const venue = await db("venue").select("name", "is_open", "timings").first();
  if (!venue) return null;
  const banners = await db("media")
    .select("id", "src_url", "title", "description")
    .where({ category: "promo-banner", active: true })
    .orderBy("position", "asc");
  const amenities = await db("amenities")
    .select("id", "amenity", "iconUrl")
    .orderBy("display_order", "asc");

  return { ...venue, banners, amenities };
};

export const getVenueData = async () => {
  const venue = await db("venue")
    .select("name", "address", "gmaps_url", "about", "is_open", "timings")
    .first();
  if (!venue) return null;
  const media = await db("media")
    .select("id", "type", "src_url", "description")
    .orderBy("position", "asc");
  const sports = await db("sports").select("*");

  return { ...venue, media, sports };
};

export const getVenue = async () => {
  const venue = await db("venue")
    .select("name", "address", "gmaps_url", "about", "is_open", "timings")
    .first();
  return venue;
};

export async function updateVenue(data, adminId) {
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

  updateData["last_updated_by_type"] = "admin";
  updateData["last_updated_by_id"] = adminId;

  const [updated] = await db("venue")
    .where({ id })
    .update(updateData)
    .returning(["name", "timings", "gmaps_url", "address", "about", "is_open"]);

  return updated;
}
