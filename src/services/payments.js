import { log } from "console";
import db from "../config/db.js";
import AppError from "../utils/AppError.js";
import { releaseSlotLock } from "../utils/redisClient.js";
import getDateString from "../utils/dateFormatter.js";
import { sendTelegramMessage } from "../utils/telegram.js";

export async function getPaymentStatus(orderId) {
  const payment = await db("payments")
    .where({ internal_order_id: orderId })
    .orWhere({ gateway_order_id: orderId })
    .first();

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  const booking = await db("booked_slots")
    .where({ id: payment.booking_id })
    .first();

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  return {
    payment_status: payment.status,
    booking_status: booking.status,
    booking_id: booking.id,
    // amount: payment.amount,
  };
}

export async function handlePaymentSuccess(payment, data) {
  let booking = null;
  await db.transaction(async (trx) => {
    await trx("payments").where({ id: payment.id }).update({
      status: "SUCCESS",
      gateway_payment_id: data.payment_id,
    });

    booking = await trx("booked_slots")
      .where({ id: payment.booking_id })
      .update({
        status: "CONFIRMED",
        last_updated_by_type: "system",
      })
      .returning("*");
  });

  if (booking.length == 0) return;
  let { box, date, start_time: startTime, end_time: endTime } = booking[0];
  date = getDateString(date);
  await releaseSlotLock({ box, date, startTime, endTime });
  const user = await db("users").where({ id: booking[0].user_id }).first();
  sendTelegramMessage(booking[0], user);
}

export async function handlePaymentFailure(payment, data) {
  let booking = null;
  await db.transaction(async (trx) => {
    await trx("payments")
      .where({ id: payment.id })
      .update({
        status: "FAILED",
        failure_reason: data.payment.payment_message || "Payment failed",
      });

    booking = await trx("booked_slots")
      .where({ id: payment.booking_id })
      .update({
        status: "EXPIRED",
        last_updated_by_type: "system",
      })
      .returning("*");
  });

  if (booking.length == 0) return;

  let { box, date, start_time: startTime, end_time: endTime } = booking[0];
  date = getDateString(date);
  await releaseSlotLock({ box, date, startTime, endTime });
}
