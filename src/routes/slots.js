import { Router } from "express";
import {
  bookSlot,
  getBookingById,
  getSlots,
  getUserBookings,
  rescheduleSlot
} from "../services/slots.js";
import {
  checkForExisting,
  validateBookingQuery,
  validateGet,
  validateSelectedSlotBody,
  validateReschedule
} from "../middlewares/validateSlot.js";
import { validateSlot } from "../services/SlotValidation.service.js";
import AppError from "../utils/AppError.js";

const router = Router();

router.get("/", validateGet, async (req, res, next) => {
  try {
    const { current_time, date, box } = req.query;
    const slots = await getSlots(Number(current_time), date, box);
    res.json({ success: true, error: "", data: slots });
  } catch (e) {
    next(e);
  }
});

router.get("/mygames", validateBookingQuery, async (req, res, next) => {
  try {
    const { filter, page, limit } = req.query;
    const result = await getUserBookings({
      userId: req.user.id,
      filter,
      page,
      limit,
    });
    return res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

router.get("/:booking_id", async (req, res, next) => {
  try {
    const { booking_id } = req.params;
    if (!booking_id) {
      throw new AppError("Invalid or missing booking_id", 400);
    }
    const result = await getBookingById(booking_id, req.user.id);
    if (!result) {
      throw new AppError("No booking found with the give ID.");
    }
    return res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/validate-slot",
  validateSelectedSlotBody,
  async (req, res, next) => {
    try {
      // await sleep(3000)
      const result = await validateSlot(req.body);
      res.json({ success: true, error: "", data: result });
    } catch (e) {
      next(e);
    }
  },
);

router.post(
  "/book",
  validateSelectedSlotBody,
  checkForExisting,
  async (req, res, next) => {
    try {
      const slotData = await validateSlot(req.body, false);

      const result = await bookSlot(slotData, req);
      console.log(result);
      
      return res.json({ success: true, error: "", data: result });
    } catch (e) {
      next(e);
    }
  },
);

router.post("/reschedule", validateReschedule, async (req, res, next) => {
  try {
    const { bookingId, date, startTime, endTime } = req.body;
    const result = await rescheduleSlot({
      bookingId,
      userId: req.user.id,
      newDate: date,
      newStartTime:startTime,
      newEndTime: endTime,
    });
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

export default router;
