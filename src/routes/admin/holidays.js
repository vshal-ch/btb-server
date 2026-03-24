import { Router } from "express";
import * as holidsysService from "../../services/holidays.js";
import {
  validateCreate,
  validateIdParam,
  validateUpdate,
} from "../../middlewares/validateHolidays.js";

const router = Router();

router.post("/", validateCreate, async (req, res, next) => {
  try {
    const resp = await holidsysService.createHoliday(req.body, req.user.id);
    res.json({ success: true, data: resp });
  } catch (e) {
    next(e);
  }
});
router.get("/", async (req, res, next) => {
  try {
    const resp = await holidsysService.getHolidays();
    res.json({ success: true, data: resp });
  } catch (e) {
    next(e);
  }
});

router.put("/:id", validateIdParam, validateUpdate, async (req, res, next) => {
  try {
    const resp = await holidsysService.updateHoliday(
      req.params.id,
      req.body,
      req.user.id,
    );
    res.json({ success: true, data: resp });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", validateIdParam, async (req, res, next) => {
  try {
    const resp = await holidsysService.deleteHoliday(req.params.id);
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
