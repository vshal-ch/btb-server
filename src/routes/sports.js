// routes/costs.js
import { Router } from "express";
import { getAllSportsWithCosts } from "../services/sports.js";

const router = Router();

router.get("/all", async (req, res, next) => {
  try {
    const costs = await getAllSportsWithCosts();
    res.json({ success: true, error: "", data: costs });
  } catch (err) {
    next(err);
  }
});

export default router