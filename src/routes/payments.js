import express from "express";
import { getPaymentStatus } from "../services/payments.js";

const router = express.Router();

router.get("/verify/:orderId", async (req, res,next) => {
  try {
    const { orderId } = req.params;

    const result = await getPaymentStatus(orderId);

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
