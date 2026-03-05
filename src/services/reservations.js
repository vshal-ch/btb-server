// services/monthlyReservationService.js

import db from "../config/db.js";

const checkOverlapWithBookedSlots = async (trx, payload) => {
  const { start_date, end_date, start_time, end_time, box } = payload;

  const overlap = await trx("booked_slots")
    .where("box", box)
    .andWhere(function () {
      this.where("status", "CONFIRMED").orWhere(function () {
        this.where("status", "LOCKED").andWhere(
          "lock_expires_at",
          ">",
          trx.fn.now(),
        );
      });
    })
    .andWhere("date", ">=", start_date)
    .andWhere("date", "<=", end_date)
    .andWhere(function () {
      this.where("start_time", "<", end_time).andWhere(
        "end_time",
        ">",
        start_time,
      );
    })
    .first();

  return overlap;
};

const checkOverlapWithMonthly = async (trx, payload, idToExclude) => {
  const { start_date, end_date, start_time, end_time, box } = payload;

  let query = trx("monthly_slot_reservations")
    .where("box", box)
    .andWhere("status", "active")
    .andWhere(function () {
      this.where("start_date", "<=", end_date).andWhere(
        "end_date",
        ">=",
        start_date,
      );
    })
    .andWhere(function () {
      this.where("start_time", "<", end_time).andWhere(
        "end_time",
        ">",
        start_time,
      );
    });

  if (idToExclude) {
    query.andWhereNot("id", idToExclude);
  }

  return await query.first();
};

export default async function createOrUpdateMonthlyReservation({
  payload,
  force,
  id,
  adminId,
}) {
  console.log(payload);

  return await db.transaction(async (trx) => {
    const overlapBooked = await checkOverlapWithBookedSlots(trx, payload, id);
    if (!force && overlapBooked) {
      return {
        warning: true,
        message:
          "This reservation overlaps with existing individual booking. Proceed?",
      };
    }
    const overlapMonthly = await checkOverlapWithMonthly(trx, payload, id);

    if (!force && overlapMonthly) {
      return {
        warning: true,
        message:
          "This reservation overlaps with existing monthly bookings. Proceed?",
      };
    }

    if (id) {
      const updated = await trx("monthly_slot_reservations")
        .where("id", id)
        .update({
          ...payload,
          updated_at: trx.fn.now(),
          last_updated_by_type: "admin",
          last_updated_by_id: adminId,
        })
        .returning("*");

      return id;
    } else {
      const [newReservation] = await trx("monthly_slot_reservations")
        .insert({
          ...payload,
          created_by_type: "admin",
          created_by_id: adminId,
        })
        .returning("*");

      return newReservation.id;
    }
  });
}
