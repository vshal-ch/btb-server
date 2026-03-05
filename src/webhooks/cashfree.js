import express from "express";
import cashfree from "../utils/cashfree.js";
import { processCashfreeEvent } from "../services/cashfree.js";

const router = express.Router();

router.post(
  "/cashfree",
  express.raw({ type: "*/*" }), // IMPORTANT for signature verification
  async (req, res) => {
    try {
      const signature = req.headers["x-webhook-signature"];
      const timestamp = req.headers["x-webhook-timestamp"];
      const idempotencyKey = req.headers["x-idempotency-key"];

      if (!signature || !timestamp || !idempotencyKey) {
        console.warn("Cashfree webhook missing required headers", {
          signaturePresent: !!signature,
          timestampPresent: !!timestamp,
          idempotencyKeyPresent: !!idempotencyKey,
        });

        // Always ACK to prevent retries
        return res.status(200).json({ success: true });
      }

      let result = cashfree.PGVerifyWebhookSignature(
        signature,
        req.body,
        timestamp,
      );

      const payload = JSON.parse(req.body.toString("utf8"));

      // 2️⃣ Process event
      await processCashfreeEvent(payload, idempotencyKey);

      return res.status(200).json({ success: true });
    } catch (err) {
      // DO NOT fail webhook — log and ack
      console.error("Cashfree webhook error", err);

      return res.status(200).json({ success: true });
    }
  },
);

export default router;
