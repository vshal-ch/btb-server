import { Router } from "express";
import { getSlotSelectionNotes,getReschedulePolicies } from "../services/notes.js";

const router = Router();

router.get("/slot-selection", async (req, res, next) => {
  try {
    const notes = await getSlotSelectionNotes();

    res.json({
      success: true,
      data: notes,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/reschedule-policies", async (req, res, next) => {
  try {
    const notes = await getReschedulePolicies();

    res.json({
      success: true,
      data: notes,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
