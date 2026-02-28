import express from "express";
import { validateCharge } from "../../middlewares/validateCharge.js";
import * as chargeService from "../../services/charges.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const data = await chargeService.getCharges();

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post("/", validateCharge, async (req, res, next) => {
  try {
    const charge = await chargeService.createCharge(
      req.chargePayload,
      req.user.id,
    );

    res.json({ success: true, data: charge });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", validateIdParam, validateCharge, async (req, res, next) => {
  try {
    const charge = await chargeService.updateCharge(
      req.params.id,
      req.body,
      req.user.id,
    );

    res.json({ success: true, data: charge });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", validateIdParam, async (req, res, next) => {
  try {
    await chargeService.deleteCharge(req.params.id);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

function validateIdParam(req, res, next) {
  const { id } = req.params;
  if (!id) {
    return next(createError(400, "Invalid or missing id"));
  }
  next();
}

export default router;
