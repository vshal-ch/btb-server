import db from "../config/db.js";
import { handlePaymentFailure, handlePaymentSuccess } from "./payments.js";

export async function processCashfreeEvent(payload, idempotencyKey) {
  const { type, data } = payload;
  const gatewayOrderId =
    payload?.data?.payment_gateway_details?.gateway_order_id;

  const orderId = payload?.data?.order?.order_id;

  if (!(gatewayOrderId || orderId)) {
    console.warn("Missing gateway_order_id in webhook payload");
    return;
  }

  const inserted = await db("payment_events")
    .insert({
      event_id: idempotencyKey,
      event_type: type,
      payload,
    })
    .onConflict("event_id")
    .ignore()
    .returning("id");

  if (inserted.length === 0) {
    return;
  }

  const payment = await db("payments")
    .where({ gateway_order_id: gatewayOrderId })
    .orWhere({ internal_order_id: orderId })
    .first();
  console.log("Payment from webhook");

  console.log(payment);

  if (!payment) {
    return;
  }

  switch (type) {
    case "PAYMENT_SUCCESS_WEBHOOK":
      await handlePaymentSuccess(payment, data);
      break;

    case "PAYMENT_FAILED_WEBHOOK":
    case "PAYMENT_USER_DROPPED_WEBHOOK":
      await handlePaymentFailure(payment, data);
      break;

    default:
      // Ignore non-terminal events
      break;
  }
}
