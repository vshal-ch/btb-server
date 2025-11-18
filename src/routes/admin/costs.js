// routes/costs.js
import express from "express";
import {
  validateCost,
  validateIdParam,
} from "../../middlewares/validateCost.js";
import * as costsService from "../../services/costs.js";
import { authMiddleware } from "../../middlewares/auth.js";

const router = express.Router();

// GET all costs
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const costs = await costsService.getAllCosts();
    res.json({ success: true, error: "", data: costs });
  } catch (err) {
    next(err);
  }
});

// POST new cost
router.post("/", authMiddleware, validateCost, async (req, res, next) => {
  try {
    const newCost = await costsService.createCost(req.body);
    res.status(201).json({ success: true, error: "", data: newCost });
  } catch (err) {
    if (err.code === "23503") {
      err.message = "Sport not found";
    } else if (err.code === "23505") {
      err.message = "Cost already exists for the sport!";
    } else {
      err.message = "Internal server error";
    }
    next(err);
  }
});

// PUT update cost
router.put(
  "/:id",
  authMiddleware,
  validateIdParam,
  validateCost,
  async (req, res, next) => {
    try {
      const updated = await costsService.updateCost(req.params.id, req.body);
      res.json({ success: true, error: "", data: updated });
    } catch (err) {
      if (err.code === "23503") {
        err.message = "Sport not found";
      } else if (err.code === "23505") {
        err.message = "Cost already exists for the sport!";
      } else {
        err.message = "Internal server error";
      }
      next(err);
    }
  }
);

// DELETE cost
router.delete(
  "/:id",
  authMiddleware,
  validateIdParam,
  async (req, res, next) => {
    try {
      const result = await costsService.deleteCost(req.params.id);
      res.json({ success: true, error: "", data: result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
