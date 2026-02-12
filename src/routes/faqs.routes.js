import express from "express";
import {getFaqs} from "../services/faqs.service.js"

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const platform = req.platform;
    const faqs = await getFaqs(platform);

    res.json({
      success: true,
      data: faqs,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
