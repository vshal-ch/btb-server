import express from "express";
import { verifyApiKey } from "../middlewares/auth.js";
import { getVenueData, updateVenue } from "../services/venue.js";
import validator from "validator";

const router = express.Router();

// GET /venue
router.get("/", async (req, res, next) => {
  try {
    const venue = await getVenueData();
    if (!venue) {
      return res
        .status(404)
        .json({ success: false, error: "Venue not found", data: {} });
    }
    res.json({ success: true, error: "", data: venue });
  } catch (err) {
    next(err);
  }
});

router.put("/", verifyApiKey, async (req, res, next) => {
  try {
    const { name, timings, gmaps_url, address, dimensions, is_open } = req.body;


    const safeData = { id:"venue-1" };

    if (name !== undefined) safeData.name = validator.escape(name);
    if (address !== undefined) safeData.address = validator.escape(address);
    if (timings !== undefined) safeData.timings = validator.escape(timings);
    if (dimensions !== undefined)
      safeData.dimensions = validator.escape(dimensions);

    if (gmaps_url !== undefined) {
      if (!isGoogleMapsUrl(gmaps_url)) {
        return res
          .status(400)
          .json({ success: false, data: {}, error: "Invalid Google Maps URL" });
      }
      safeData.gmaps_url = gmaps_url; // keep original
    }

    if (is_open !== undefined) {
      if (typeof is_open !== "boolean") {
        return res
          .status(400)
          .json({ success: false, data: {}, error: "is_open must be boolean" });
      }
      safeData.is_open = is_open;
    }

    const updated = await updateVenue(safeData);
    res.json({ success: true, data: updated, error: "" });
  } catch (err) {
    next(err);
  }
});

function isGoogleMapsUrl(url) {
  if (!validator.isURL(url, { require_protocol: true })) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.endsWith("google.com") &&
      (parsed.pathname.startsWith("/maps") ||
        parsed.hostname.startsWith("maps."))
    );
  } catch (e) {
    return false;
  }
}

export default router;
