import { Router } from "express";
import { getSlots } from "../services/slots.js";
import { validateGet } from "../middlewares/validateSlot.js";

const router = Router();

router.get("/", validateGet, async (req, res, next) => {
  try {
    const { current_time, date } = req.query;
    const slots = await getSlots(Number(current_time), date);
    res.json({ success: true, error: "", data: slots });
  } catch (e) {
    next(e);
  }
});

export default router;
