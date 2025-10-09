import express from "express";
import { getVenueData } from "../services/venue.js";

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

export default router;
