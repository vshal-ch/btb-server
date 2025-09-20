// routes/costs.js
import express from "express";
import { verifyApiKey } from "../middlewares/auth.js";
import { validateCost, validateIdParam } from "../middlewares/validateCost.js";
import * as costsService from "../services/costs.js";

const router = express.Router();

// GET all costs
router.get("/", verifyApiKey, async (req, res, next) => {
  try {
    const costs = await costsService.getAllCosts();
    res.json({ success: true, error: "", data: costs });
  } catch (err) {
    next(err);
  }
});

// POST new cost
router.post("/", verifyApiKey, validateCost, async (req, res, next) => {
  try {
    const newCost = await costsService.createCost(req.body);
    res.status(201).json({ success: true, error: "", data: newCost });
  } catch (err) {
    next(err);
  }
});

// PUT update cost
router.put(
  "/:id",
  verifyApiKey,
  validateIdParam,
  validateCost,
  async (req, res, next) => {
    try {
      const updated = await costsService.updateCost(req.params.id, req.body);
      res.json({ success: true, error: "", data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE cost
router.delete("/:id", verifyApiKey, validateIdParam, async (req, res, next) => {
  try {
    const result = await costsService.deleteCost(req.params.id);
    res.json({ success: true, error: "", data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
