import { checkRedisLockedSlots } from "../utils/redisClient.js";
import db from "../config/db.js";
import { calculateCostBreakdown, getCostSportDetailBySport } from "./costs.js";
import { applyOffers } from "./offer.service.js";
import AppError from "../utils/AppError.js";
import { getCheckoutNotes } from "./notes.js";
import getDateString from "../utils/dateFormatter.js";

export async function validateSlot(req, withPolicies = true) {
  const { date, box, sportId, startTime, endTime } = req;

  // 1️⃣ Date validation
  let selectedDate = new Date(date);
  
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  if (selectedDate < startOfToday) {
    throw new AppError("Cannot book past date", 400);
  }
  if (selectedDate == startOfToday) {
    if ((startTime + 12) * 30 < getCurrentMinutes()) {
      throw new AppError("Cannot book past time", 400);
    }
  }

  const cost = await getCostSportDetailBySport(sportId);

  if (!cost) throw new AppError("Invalid sport", 400);
  if (cost.box !== box)
    throw new AppError("Invalid box " + box + " for " + cost.sport, 400);

  // 2️⃣ DB collision (blocked/booked)
  const blocked = await db("booked_slots")
    .where({ date, box })
    .where("status", "CONFIRMED")
    .andWhere((q) =>
      q.where("start_time", "<", endTime).andWhere("end_time", ">", startTime),
    )
    .first();

  if (blocked) {
    throw new AppError("Slot already booked", 400);
  }

  await checkRedisLockedSlots({
    box,
    date: getDateString(selectedDate),
    startTime,
    endTime,
  });

  // 5️⃣ Base + surcharge breakdown
  const baseBreakdown = await calculateCostBreakdown(
    cost,
    startTime,
    endTime,
    selectedDate,
  );

  // 6️⃣ Apply offers
  const { finalTotal, offerBreakdown, appliedOffers } = await applyOffers(
    baseBreakdown.total,
    {
      date: selectedDate,
      sportId,
      durationUnits: endTime - startTime,
      startTime,
      endTime,
    },
  );

  return {
    date: getDateString(selectedDate),
    startTime: startTime,
    endTime: endTime,
    sport: cost.sport,
    box,
    total: finalTotal,
    breakdown: [...baseBreakdown.items, ...offerBreakdown],
    //   offersApplied: appliedOffers,
    policies: withPolicies ? await getCheckoutNotes() : [],
  };
}

function getCurrentMinutes() {
  const day = new Date();
  return day.getHours() * 60 + day.getMinutes();
}
