import express from "express";
import * as sportsService from "../../services/sports.js";
import { authMiddleware } from "../../middlewares/auth.js";
import validator from "validator";
import createError from "http-errors";

const router = express.Router();

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const costs = await sportsService.getAllSportsWithCosts();
    res.json({ success: true, error: "", data: costs });
  } catch (err) {
    next(err);
  }
});

router.post("/", authMiddleware, validateSport, async (req, res, next) => {
  try {
    const newSport = await sportsService.createSport(req.body, req.user.id);
    res.status(201).json({ success: true, error: "", data: newSport });
  } catch (err) {
    next(err);
  }
});

router.put(
  "/:id",
  authMiddleware,
  validateIdParam,
  validateSport,
  async (req, res, next) => {
    try {
      const updated = await sportsService.updateSport(
        req.params.id,
        req.body,
        req.user.id,
      );
      res.json({ success: true, error: "", data: updated });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/:id",
  authMiddleware,
  validateIdParam,
  async (req, res, next) => {
    try {
      const result = await sportsService.deleteSport(req.params.id);
      res.json({ success: true, error: "", data: result });
    } catch (err) {
      next(err);
    }
  },
);

function validateIdParam(req, res, next) {
  const { id } = req.params;
  if (!id) {
    return next(createError(400, "Invalid or missing id"));
  }
  next();
}

function validateSport(req, res, next) {
  const { sport, box, evening_cost, weekend_cost, cost } = req.body;

  if (
    !sport ||
    typeof sport !== "string" ||
    !validator.isAlphanumeric(sport, undefined, { ignore: " " })
  ) {
    return next(
      createError(400, "Sport is required and must be a Alphanumeric string"),
    );
  }

  if (
    !box ||
    typeof box !== "string" ||
    !validator.isAlphanumeric(box, undefined, { ignore: " -" })
  ) {
    return next(
      createError(400, "Box is required and must be a Alphanumeric string"),
    );
  }

  if (cost === undefined || isNaN(Number(cost))) {
    return next(createError(400, "cost is required and must be a number"));
  }

  if (weekend_cost && isNaN(Number(weekend_cost))) {
    return next(createError(400, "Weekend cost must be numeric"));
  }

  if (evening_cost && isNaN(Number(evening_cost))) {
    return next(createError(400, "Evening cost must be numeric"));
  }
  next();
}

export default router;
