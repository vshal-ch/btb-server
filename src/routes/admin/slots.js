import { Router } from "express";
import {
  getSlots,
  createSlot,
  updateSlot,
  deleteSlot,
  getAllSlots,
} from "../../services/slots.js";
import { authMiddleware } from "../../middlewares/auth.js";
import {
  validateGet,
  validateNewSlot,
  validateUpdatedSlot,
} from "../../middlewares/validateSlot.js";

const router = Router();

router.post("/", authMiddleware, validateNewSlot, async (req, res, next) => {
  try {
    const { start_time, end_time, note, blocked, date } = req.slotData;
    const slot = await createSlot({ start_time, end_time, note, blocked, date });
    res.status(201).json({ success: true, error: "", data: slot });
  } catch (err) {
    next(err);
  }
});

// PUT /slot/id
router.put(
  "/:id",
  authMiddleware,
  validateUpdatedSlot,
  async (req, res, next) => {
    try {
      const id = req.params.id;
      const slotData = req.slotData;
      const existing = req.existing;
      const slot = await updateSlot(id, slotData, existing);
      res.json({ success: true, error: "", data: slot });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /slot/id
router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id)
      return res
        .status(400)
        .json({ success: false, data: {}, error: "id is required" });
    const slot = await deleteSlot(id);
    res.json({ success: true, error: "", data: slot });
  } catch (err) {
    next(err);
  }
});

// GET /all?all=boolean&only_blocked=boolean&current_time=timestamp
router.get("/all", authMiddleware, async (req, res, next) => {
  try {
    const { all, only_blocked, current_time, date } = req.query;

    if (all === undefined) {
      return res
        .status(400)
        .json({ success: false, data: {}, error: "all parameter is required" });
    }

    const query = getAllSlots({
      all: all === "true",
      only_blocked: only_blocked === undefined ? null : only_blocked === "true",
      current_time: Number(current_time),
      date: date
    });

    const slots = await query

    res.json({ success: true, error: "", data: slots });
  } catch (err) {
    next(err);
  }
});

export default router;
