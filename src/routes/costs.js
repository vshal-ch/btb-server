// routes/costs.js
import { Router } from "express";
import * as costsService from "../services/costs.js";
import { validateSportIdParam } from "../middlewares/validateCost.js";

const router = Router();

// router.get("/all_costs", async (req, res, next) => {
//   try {
//     const costs = await costsService.getAllCosts();
//     res.json({ success: true, error: "", data: costs });
//   } catch (err) {
//     next(err);
//   }
// });

router.get("/:sport_id", validateSportIdParam,async (req, res, next) => {
  try {
    const cost = await costsService.getCostBySport(req.sport_id);
    res.json({ success: true, error: "", data: cost });
  } catch (err) {
    
    next(err);
  }
});



export default router;
