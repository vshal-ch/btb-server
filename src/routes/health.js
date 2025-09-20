import { Router, text } from "express";
import db from "../config/db.js";

const router = Router();

router.get("/health", async (req, res) => {
  try {
    const result = await db.raw("select 1");
    res.json({ success: true, status: "ok" });
  } catch (e) {
    e.status = 500;
    e.message = "Database connection failed";
    next(e);
  }
});

export default router;
