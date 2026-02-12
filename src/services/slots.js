import db from "../config/db.js";
import AppError from "../utils/AppError.js";
import { createCFOrder } from "../utils/cashfree.js";
import getDateString from "../utils/dateFormatter.js";
import { genGamePassCode } from "../utils/passcode-gen.js";
import redis, {
  getLockedSlots,
  lockSlots,
  releaseSlotLock,
} from "../utils/redisClient.js";
import { calculateCostBreakdown, getCostBySport } from "./costs.js";
import { getVenuePolicies } from "./notes.js";

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

  const lockedSlots = await getLockedSlots(box, getDateString(date));

  return [...booked_slots, ...lockedSlots];
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
  date,
  startTime,
  endTime,
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

    /* 2️⃣ Duration must remain same */
    const originalDuration = original.end_time - original.start_time;
    if (endTime - startTime !== originalDuration) {
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

    /* 4️⃣ New slot must not be in the past */
    const newStart = computeDateTime(date, startTime);
    if (newStart.getTime() < Date.now()) {
      throw new AppError("Cannot reschedule to a past slot", 400);
    }

    /* 5️⃣ Collision check */
    const conflict = await trx("booked_slots")
      .where({
        box: original.box,
        date,
        status: "CONFIRMED",
      })
      .andWhere("start_time", "<", endTime)
      .andWhere("end_time", ">", startTime)
      .first();

    if (conflict) {
      throw new AppError("Selected slot is no longer available", 409);
    }

    const cost = await getCostBySport(original.sport);
    /* 6️⃣ Price must remain same */
    const recalculatedPrice = calculateCostBreakdown(
      cost,
      startTime,
      endTime,
      new Date(date),
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
    });

    /* 8️⃣ Insert new booking row */
    const [newBooking] = await trx("booked_slots")
      .insert({
        id: crypto.randomUUID(),
        user_id: original.user_id,
        box: original.box,
        date,
        start_time: startTime,
        end_time: endTime,
        end_at: computeDateTime(date, endTime),
        sport: original.sport,
        total_time: originalDuration,
        total_amount: original.total_amount,
        status: "CONFIRMED",
        game_pass_code: genGamePassCode(),
        rescheduled_from_id: original.id,
      })
      .returning("*");

    return newBooking.id;
  });
}

export async function createSlot({
  start_time,
  end_time,
  note,
  blocked,
  date,
  sport,
}) {
  const existing = await db("booked_slots")
    .where({ start_time, end_time, date })
    .first();

  if (existing) {
    if (existing.blocked === false) {
      await db("booked_slots")
        .where({ id: existing.id })
        .update({ blocked: true });
      return { ...existing, blocked: true };
    }
    throw new Error("Slot already exists and is blocked");
  }

  const [inserted] = await db("booked_slots")
    .insert({
      id: crypto.randomUUID(),
      start_time,
      end_time,
      note,
      blocked: blocked,
      date: date, // yyyy-mm-dd
      sport: sport,
    })
    .returning("*");

  return inserted;
}

export async function updateSlot(id, slotData, existing) {
  const changes = {};

  ["start_time", "end_time", "note", "blocked", "date", "sport"].forEach(
    (field) => {
      if (
        slotData[field] !== undefined &&
        slotData[field] !== existing[field]
      ) {
        changes[field] = slotData[field];
      }
    },
  );

  if (Object.keys(changes).length === 0) return existing;

  const [updated] = await db("booked_slots")
    .where({ id })
    .update(changes)
    .returning("*");

  return updated;
}

export async function deleteSlot(id) {
  const existing = await db("booked_slots").where({ id }).first();
  if (!existing) throw new Error("Slot not found");

  await db("booked_slots").where({ id }).delete();
  return existing;
}

export function getAllSlots({ all, only_blocked, current_time, date }) {
  let query = db("booked_slots")
    .select("*")
    .orderBy("date", "desc")
    .orderBy("start_time", "desc");

  if (!all) {
    query = query
      .where("end_time", ">", current_time)
      .andWhere("date", ">=", date);
  }

  if (only_blocked === true) {
    query = query.where("blocked", only_blocked);
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
