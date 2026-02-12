import express from "express";
import { getNextBookingForUser } from "../services/slots.js";

const router = express.Router();

router.get("/bookings/next", async (req, res, next) => {
  try {
    const user = req.user;
    const booking = await getNextBookingForUser(user.id);

    return res.status(200).json({
      success: true,
      data: booking, // can be null
    });
  } catch (error) {
    next(error);
  }
});

export default router;
