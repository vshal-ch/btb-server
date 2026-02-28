import db from "../config/db.js";
import AppError from "../utils/AppError.js";
import { createCFOrder } from "../utils/cashfree.js";
import getDateString from "../utils/dateFormatter.js";
import { genGamePassCode } from "../utils/passcode-gen.js";
import redis, {
  checkRedisLockedSlots,
  getLockedSlots,
  lockSlots,
  releaseSlotLock,
} from "../utils/redisClient.js";
import { calculateCostBreakdown, getCostBySport } from "./costs.js";
import { getVenuePolicies } from "./notes.js";
import { convertRowIntoSlotDetail } from "../utils/mapper.js";

export async function getBookingById(booking_id, user_id) {
  const booking = await db("booked_slots")
    .select(
      "id",
      "box",
      "date",
      "start_time",
      "end_time",
      "sport",
      "game_pass_code",
      "attended",
      "total_amount",
      "rescheduled_from_id",
    )
    .where({ id: booking_id, user_id: user_id, status: "CONFIRMED" })
    .first();
  if (!booking) {
    throw new AppError("No booking found with the given ID.");
  }
  const policies = await getVenuePolicies();
  const venue = await db("venue")
    .select("name", "address", "gmaps_url")
    .first();
  if (!venue) {
    throw new AppError("Server error B-442! please try again");
  }
  return { venue, booking, policies };
}

export async function getSlotByGamePassCode(game_pass_code) {
  const slot = await db("booked_slots as bs")
    .leftJoin("users as u", "bs.user_id", "u.id")
    .leftJoin("payments as p", "p.booking_group_id", "bs.booking_group_id")
    .where({ game_pass_code, "bs.status": "CONFIRMED" })
    .select(
      "bs.*",

      "p.amount as payment_amount",
      "p.status as payment_status",
      "p.failure_reason",
      "p.internal_order_id as order_id",

      "u.name as user_name",
      "u.email",
      "u.phone_no",
      "u.avatar_url",
    )
    .first();

  if (!slot) {
    throw new AppError("Invalid game pass code", 404);
  }

  let admin = null;
  console.log(slot.created_by_type, slot.created_by_id);

  if (slot.created_by_type === "admin") {
    admin = await db("admins").where("id", slot.created_by_id);
  }
  console.log(admin);

  return convertRowIntoSlotDetail(slot, admin);
}

export async function getSlotByID(id) {
  const slot = await db("booked_slots as bs")
    .leftJoin("users as u", "bs.user_id", "u.id")
    .leftJoin("payments as p", "p.booking_group_id", "bs.booking_group_id")
    .where({ "bs.id": id })
    .select(
      "bs.*",

      "p.amount as payment_amount",
      "p.status as payment_status",
      "p.failure_reason",
      "p.internal_order_id as order_id",

      "u.name as user_name",
      "u.email",
      "u.phone_no",
      "u.avatar_url",
    )
    .first();

  if (!slot) {
    throw new AppError("Invalid game pass code", 404);
  }

  let admin = null;

  if (slot.created_by_type === "admin") {
    admin = await db("admins").where("id", slot.created_by_id).first();
  }

  return convertRowIntoSlotDetail(slot, admin);
}

export async function getNextBookingForUser(user_id) {
  const booking = await db("booked_slots")
    .select("id", "start_time", "end_time", "date", "sport", "box")
    .where("user_id", user_id)
    .andWhere("status", "CONFIRMED")
    .andWhere("attended", false)
    .andWhere("end_at", ">", db.fn.now())
    .orderBy("end_at", "asc")
    .first();

  return booking || null;
}

export async function getUserBookings({
  userId,
  filter = "all",
  page = 1,
  limit = 10,
}) {
  const offset = (page - 1) * limit;
  const now = new Date();

  const baseQuery = db("booked_slots")
    .where({ user_id: userId })
    .andWhere("status", "CONFIRMED");

  if (filter === "future") {
    baseQuery.andWhere("end_at", ">", now);
  }

  if (filter === "past") {
    baseQuery.andWhere("end_at", "<=", now);
  }

  if (filter === "attended") {
    baseQuery.andWhere("attended", true);
  }

  const [items, [{ count }]] = await Promise.all([
    baseQuery
      .clone()
      .orderBy("date", "desc")
      .orderBy("end_time", "desc")
      .limit(limit)
      .offset(offset),

    baseQuery.clone().count("* as count"),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total: Number(count),
      has_next: offset + items.length < count,
    },
  };
}

export async function getSlots(currentTime, date, box) {
  if (currentTime) {
    let currentUnit = Math.floor(currentTime / 30);
    return db("booked_slots")
      .where("box", box)
      .where("date", date)
      .where("status", "CONFIRMED")
      .andWhere("end_time", ">=", currentUnit)
      .select("id", "start_time", "end_time", "date", "sport");
  }

  const booked_slots = await db("booked_slots")
    .where("box", box)
    .where("date", date)
    .where("status", "CONFIRMED")
    .select("id", "start_time", "end_time", "date", "sport");

  const monthlyReservations = await db("monthly_slot_reservations")
    .where("box", box)
    .where("status", "active")
    .where("start_date", "<=", date)
    .where("end_date", ">=", date)
    .select("id", "start_time", "end_time", "sport");

  const monthlySlots = monthlyReservations.map((r) => ({
    id: `m-${r.id}`, // distinguish source
    start_time: r.start_time,
    end_time: r.end_time,
    date,
    sport: r.sport,
  }));

  const lockedSlots = await getLockedSlots(box, getDateString(date));

  return [...booked_slots, ...lockedSlots, ...monthlySlots];
}

export async function markSlotAsAttended(bookingId, adminId) {
  return await db.transaction(async (trx) => {
    const slot = await trx("booked_slots")
      .where("id", bookingId)
      .forUpdate()
      .first();

    if (!slot) {
      throw new Error("Booking not found");
    }

    if (slot.status !== "CONFIRMED") {
      throw new Error("Only confirmed bookings can be marked attended");
    }

    if (slot.attended) {
      throw new Error("Slot already marked as attended");
    }

    const now = new Date();

    const hours = Math.floor(slot.start_time / 2);
    const minutes = slot.start_time % 2 === 0 ? 0 : 30;

    const slotStart = new Date(slot.date);
    slotStart.setHours(hours, minutes, 0, 0);

    const diffMinutes = Math.floor((slotStart - now) / 60000);

    if (diffMinutes > 15) {
      throw new Error(
        "Attendance can only be marked within 15 minutes before start time or after it starts",
      );
    }

    await trx("booked_slots").where("id", bookingId).update({
      attended: true,
      last_updated_by_type: "admin",
      last_updated_by_id: adminId,
      updated_at: trx.fn.now(),
    });

    const updated = await trx("booked_slots").where("id", bookingId).first();

    return updated;
  });
}

export async function bookSlot(slotData, req) {
  const { date, box, startTime, endTime } = slotData;
  const tempBookingId = crypto.randomUUID();
  const redisLockValue = {
    user_id: req.user.id,
    booking_id: tempBookingId,
    sport: slotData.sport,
  };

  const lockAcquired = await lockSlots(
    { date, box, startTime, endTime },
    redisLockValue,
  );

  if (!lockAcquired) {
    throw new AppError("Slot is currently locked by another user", 409);
  }

  let bookingRow;
  let internalOrderId;
  let cfOrder;

  try {
    await db.transaction(async (trx) => {
      const [booking] = await trx("booked_slots")
        .insert({
          id: tempBookingId,
          user_id: req.user.id,
          box: box,
          date: date,
          start_time: startTime,
          end_time: endTime,
          sport: slotData.sport,
          status: "LOCKED",
          total_time: endTime - startTime,
          total_amount: slotData.total,
          game_pass_code: genGamePassCode(),
          end_at: trx.raw(
            `((?::date + time '06:00') + (? * interval '30 minutes'))::timestamptz`,
            [date, endTime],
          ),
          lock_expires_at: trx.raw(
            `(now() + (? * interval '1 second'))::timestamptz`,
            [process.env.SLOT_LOCK_TTL_SECONDS],
          ),
          created_by_type: "user",
          created_by_id: req.user.id,
          booking_group_id: tempBookingId,
        })
        .returning("*");

      bookingRow = booking;

      internalOrderId = `ORD_${crypto.randomUUID()}`;

      cfOrder = await createCFOrder({
        order_id: internalOrderId,
        order_amount: slotData.total,
        order_currency: "INR",
        customer_details: {
          customer_id: req.user.id,
          customer_phone: req.user.phone_no,
        },
        order_meta: {
          payment_methods: "upi",
        },
      });

      await trx("payments").insert({
        booking_id: booking.id,
        booking_group_id: booking.booking_group_id,
        gateway: "CASHFREE",
        internal_order_id: internalOrderId,
        gateway_order_id: cfOrder.cf_order_id,
        payment_session_id: cfOrder.payment_session_id,
        amount: cfOrder.order_amount,
        status: "CREATED",
      });
    });
    return {
      booking_id: bookingRow.id,
      internal_order_id: internalOrderId,
      gateway_order_id: cfOrder.cf_order_id,
      payment_session_id: cfOrder.payment_session_id,
      expires_at: bookingRow.lock_expires_at,
    };
  } catch (err) {
    await releaseSlotLock({ date, box, startTime, endTime });

    if (bookingRow?.id) {
      await db("booked_slots")
        .where({ id: bookingRow.id })
        .update({ status: "EXPIRED" });
    }

    if (err instanceof AppError) {
      throw err; // already clean
    }

    // Cashfree-specific failure
    if (err?.source === "CASHFREE") {
      throw new AppError(
        "Unable to initiate payment at the moment. Please try again.",
        502,
      );
    }

    // DB constraint / race condition
    if (err?.code === "23P01") {
      // exclusion constraint
      throw new AppError("Slot was just booked by another user", 409);
    }

    // Generic fallback
    throw new AppError(
      err.message || "Failed to create booking. Please try again.",
    );
  }
}

export async function rescheduleSlot({
  bookingId,
  userId,
  newDate,
  newStartTime,
  newEndTime,
}) {
  return db.transaction(async (trx) => {
    const original = await trx("booked_slots")
      .where({ id: bookingId, user_id: userId, status: "CONFIRMED" })
      .forUpdate()
      .first();

    if (!original) {
      throw new AppError("Booking not found", 404);
    }

    if (original.attended) {
      throw new AppError("Attended bookings cannot be rescheduled", 400);
    }

    if (
      original.rescheduled_from_id != null &&
      original.rescheduled_from_id.trim() !== ""
    ) {
      throw new AppError("Rescheduling is allowed only once.", 400);
    }

    /* 2️⃣ Duration must remain same */
    const originalDuration = original.end_time - original.start_time;
    if (newEndTime - newStartTime !== originalDuration) {
      throw new AppError("Booking duration cannot be changed", 400);
    }

    /* 3️⃣ 2-hour cutoff */
    const originalStart = computeDateTime(original.date, original.start_time);

    if (Date.now() >= originalStart.getTime() - 2 * 60 * 60 * 1000) {
      throw new AppError(
        "Rescheduling is allowed only up to 2 hours before start time",
        400,
      );
    }

    if (
      newDate === original.date &&
      newStartTime === original.start_time &&
      newEndTime === original.end_time
    ) {
      throw new AppError("Same as original slot.", 400);
    }

    /* 4️⃣ New slot must not be in the past */
    const newStart = computeDateTime(newDate, newStartTime);
    if (newStart.getTime() < Date.now()) {
      throw new AppError("Cannot reschedule to a past slot", 400);
    }

    const monthSlotReservationCheck = await trx("monthly_slot_reservations")
      .where("box", original.box)
      .where("status", "active")
      .where("start_date", "<=", newDate)
      .where("end_date", ">=", newDate)
      .andWhere((q) =>
        q
          .where("start_time", "<", newEndTime)
          .andWhere("end_time", ">", newStartTime),
      )
      .first();

    if (monthSlotReservationCheck) {
      throw new AppError("Selected slot is no longer available", 409);
    }

    /* 5️⃣ Collision check */
    const conflict = await trx("booked_slots")
      .where({
        box: original.box,
        date: newDate,
        status: "CONFIRMED",
      })
      .whereNot("id", original.id)
      .andWhere("start_time", "<", newEndTime)
      .andWhere("end_time", ">", newStartTime)
      .first();

    if (conflict) {
      throw new AppError("Selected slot is no longer available", 409);
    }

    const cost = await getCostBySport(original.sport);
    /* 6️⃣ Price must remain same */
    const recalculatedPrice = calculateCostBreakdown(
      cost,
      newStartTime,
      newEndTime,
      new Date(newDate),
    );

    const originalPriceWithoutDiscount = calculateCostBreakdown(
      cost,
      original.start_time,
      original.end_time,
      new Date(original.date),
    );

    if (
      Number(recalculatedPrice.total) !==
      Number(originalPriceWithoutDiscount.total)
    ) {
      throw new AppError("Price mismatch during reschedule", 400);
    }

    /* 7️⃣ Mark old booking as RESCHEDULED */
    await trx("booked_slots").where({ id: original.id }).update({
      status: "RESCHEDULED",
      last_updated_by_type: "user",
      last_updated_by_id: userId,
    });

    /* 8️⃣ Insert new booking row */
    const [newBooking] = await trx("booked_slots")
      .insert({
        id: crypto.randomUUID(),
        user_id: original.user_id,
        box: original.box,
        date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
        end_at: computeDateTime(newDate, newEndTime),
        sport: original.sport,
        total_time: originalDuration,
        total_amount: original.total_amount,
        status: "CONFIRMED",
        game_pass_code: genGamePassCode(),
        rescheduled_from_id: original.id,
        created_by_type: "user",
        created_by_id: userId,
        booking_group_id: original.booking_group_id,
      })
      .returning("*");

    return newBooking.id;
  });
}

export async function createSlot({
  start_time,
  end_time,
  note,
  status,
  date,
  sport,
  total_amount,
  box,
  adminId,
}) {
  try {
    return await db.transaction(async (trx) => {
      const overlap = await trx("booked_slots")
        .where("date", date)
        .andWhere("box", box)
        .andWhere(function () {
          this.where("status", "CONFIRMED").orWhere("status", "UNCONFIRMED");
        })
        .andWhere(function () {
          this.where("start_time", "<", end_time).andWhere(
            "end_time",
            ">",
            start_time,
          );
        })
        .first();

      if (overlap) {
        throw new AppError("Slot overlaps with an existing booking", 400);
      }

      await checkRedisLockedSlots({
        box,
        date: getDateString(date),
        startTime: start_time,
        endTime: end_time,
      });

      const monthly_slot_check = await trx("monthly_slot_reservations")
        .where("box", box)
        .where("status", "active")
        .where("start_date", "<=", date)
        .where("end_date", ">=", date)
        .andWhere((q) =>
          q
            .where("start_time", "<", end_time)
            .andWhere("end_time", ">", start_time),
        )
        .first();

      if (monthly_slot_check) {
        throw new AppError("Slot already booked in monthly slots", 400);
      }

      const tempBookingId = crypto.randomUUID();
      console.log(status);

      await trx("booked_slots").insert({
        id: tempBookingId,
        box: box,
        date: date,
        start_time: start_time,
        end_time: end_time,
        sport: sport,
        status: status,
        total_time: end_time - start_time,
        total_amount: total_amount,
        note: note,
        game_pass_code: genGamePassCode(),
        end_at: trx.raw(
          `((?::date + time '06:00') + (? * interval '30 minutes'))::timestamptz`,
          [date, end_time],
        ),
        created_by_type: "admin",
        created_by_id: adminId,
        booking_group_id: tempBookingId,
      });

      return tempBookingId;
    });
  } catch (err) {
    if (err instanceof AppError) {
      throw err; // already clean
    }
    // DB constraint / race condition
    if (err?.code === "23P01") {
      // exclusion constraint
      throw new AppError("Slot was just booked by another user", 409);
    }

    // Generic fallback
    throw new AppError(
      err.message || "Failed to create booking. Please try again.",
    );
  }
}

export async function updateSlot(id, slotData, existing, adminId) {
  const { start_time, end_time, note, status, date, sport, box, total_amount } =
    slotData;
  try {
    return await db.transaction(async (trx) => {
      const overlap = await trx("booked_slots")
        .where("date", date)
        .andWhere("box", box)
        .andWhereNot("id", id)
        .andWhere(function () {
          this.where("status", "CONFIRMED").orWhere("status", "UNCONFIRMED");
        })
        .andWhere(function () {
          this.where("start_time", "<", end_time).andWhere(
            "end_time",
            ">",
            start_time,
          );
        })
        .first();

      if (overlap) {
        throw new AppError("Slot overlaps with an existing booking", 400);
      }

      await checkRedisLockedSlots({
        box,
        date: getDateString(date),
        startTime: start_time,
        endTime: end_time,
      });

      const monthly_slot_check = await trx("monthly_slot_reservations")
        .where("box", box)
        .where("status", "active")
        .where("start_date", "<=", date)
        .where("end_date", ">=", date)
        .andWhere((q) =>
          q
            .where("start_time", "<", end_time)
            .andWhere("end_time", ">", start_time),
        )
        .first();

      if (monthly_slot_check) {
        throw new AppError("Slot already booked in monthly slots", 400);
      }

      const changes = {};

      [
        "start_time",
        "end_time",
        "note",
        "status",
        "date",
        "sport",
        "box",
        "total_amount",
      ].forEach((field) => {
        if (
          slotData[field] !== undefined &&
          slotData[field] !== existing[field]
        ) {
          changes[field] = slotData[field];
        }
      });

      if (Object.keys(changes).length === 0) return id;

      await trx("booked_slots")
        .where({ id })
        .update({
          ...changes,
          last_updated_by_id: adminId,
          last_updated_by_type: "admin",
          updated_at: trx.fn.now(),
        });

      return id;
    });
  } catch (err) {
    if (err instanceof AppError) {
      throw err; // already clean
    }
    // DB constraint / race condition
    if (err?.code === "23P01") {
      // exclusion constraint
      throw new AppError("Slot was just booked by another user", 409);
    }

    // Generic fallback
    throw new AppError(
      err.message || "Failed to create booking. Please try again.",
    );
  }
}

export async function deleteSlot(id) {
  const existing = await db("booked_slots").where({ id }).first();
  if (!existing) throw new AppError("Slot not found", 400);
  if (existing.created_by_type === "user") {
    throw new AppError("Slot created by user cannot be deleted", 400);
  }
  await db("booked_slots").where({ id }).delete();
  return existing;
}

export function buildSlotFilterQuery({ dateType, date, statuses }) {
  let query = db("booked_slots");

  // -------------------------
  // DATE FILTER
  // -------------------------

  if (dateType === "on_date" && date) {
    query = query.where("date", date);
  }

  if (dateType === "from_date" && date) {
    query = query.where("date", ">=", date);
  }

  // If dateType === "all" → no date filter

  // -------------------------
  // STATUS FILTER
  // -------------------------

  if (!statuses.includes("all")) {
    const mappedStatuses = [];

    if (statuses.includes("CONFIRMED")) {
      mappedStatuses.push("CONFIRMED");
    }

    if (statuses.includes("EXPIRED")) {
      mappedStatuses.push("EXPIRED");
    }

    if (statuses.includes("FAILED")) {
      mappedStatuses.push("FAILED");
    }

    if (statuses.includes("RESCHEDULED")) {
      mappedStatuses.push("RESCHEDULED");
    }
    if (statuses.includes("LOCKED")) {
      mappedStatuses.push("LOCKED");
    }
    if (mappedStatuses.length) {
      query = query.whereIn("status", mappedStatuses);
    }
    // if (statuses.includes("LOCKED")) {
    //   // Example logic: locked = status PENDING or lock_expires_at > now
    //   query = query.orWhere(function () {
    //     this.where("status", "LOCKED")
    //       .whereNotNull("lock_expires_at")
    //       .where("lock_expires_at", ">", db.fn.now());
    //   });
    // }
  }

  return query;
}

export function computeDateTime(date, unit) {
  // unit 0 = 6:00 AM, each unit = 30 mins
  const minutesFromMidnight = (unit + 12) * 30;

  const hours = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;

  return new Date(`${date}T${pad(hours)}:${pad(minutes)}:00`);
}

function pad(n) {
  return n.toString().padStart(2, "0");
}

function minutesToUnit(minutes) {
  return minutes / 30;
}
