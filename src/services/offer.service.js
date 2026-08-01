import db from "../config/db.js";

// export async function applyOffers(baseTotal, ctx) {
//   let total = baseTotal;
//   const breakdown = [];
//   const applied = [];

//   const offers = await loadOffersWithConditions(ctx);

//   //todo: implement condtionmatch
//   for (const offer of offers) {
//     // if (!conditionsMatch(offer, ctx)) continue

//     const discount =
//       offer.discount_type === "PERCENT"
//         ? (total * offer.discount_value) / 100
//         : offer.discount_value;

//     total -= discount;
//     breakdown.push({
//       label: `${offer.title}${offer.discount_type === "PERCENT" ? "(" + offer.discount_value + "%)" : ""}`,
//       amount: -discount,
//     });

//     applied.push(offer.title);

//     if (!offer.is_stackable) break;
//   }

//   return {
//     totalAfterOffer: Math.round(total),
//     offerBreakdown: breakdown,
//     appliedOffers: applied,
//   };
// }

export const getOffers = async () => {
  return await db("offers as o")
    .leftJoin("offer_conditions as con", "o.id", "con.offer_id")
    .groupBy("o.id")
    .select(
      "o.id",
      "o.title",
      "o.description",
      "o.discount_type",
      "o.discount_value",
      "o.active_from",
      "o.active_until",
      "o.priority",
      "o.is_active",
      "o.is_stackable",
      "o.max_discount_amount",
      "o.apply_on",
      db.raw(`
      COALESCE(
        json_agg(
          json_build_object(
            'id', con.id,
            'condition_type', con.condition_type,
            'operator', con.operator,
            'value', con.value
          )
        ) FILTER (WHERE con.id IS NOT NULL),
        '[]'
      ) as conditions
    `),
    )
    .orderBy("o.priority", "asc")
    .orderBy("o.created_at", "desc");
};

export const getOfferById = async (id) => {
  return await db("offers").where("id", id).first();
};

export const createOffer = async (payload, adminId) => {
  return await db.transaction(async (trx) => {
    const { conditions = [], ...offerData } = payload;

    const [offer] = await trx("offers")
      .insert({
        ...offerData,
        created_by_type: "admin",
        created_by_id: adminId,
      })
      .returning("*");

    if (conditions.length > 0) {
      const mapped = conditions.map((c) => ({
        offer_id: offer.id,
        condition_type: c.condition_type,
        operator: c.operator,
        value: c.value,
        created_by_type: "admin",
        created_by_id: adminId,
      }));

      await trx("offer_conditions").insert(mapped);
    }

    return offer;
  });
};

export const updateOffer = async (id, payload, adminId) => {
  return await db.transaction(async (trx) => {
    const existing = await trx("offers").where("id", id).first();

    if (!existing) {
      throw new Error("Offer not found");
    }

    const { conditions, ...incoming } = payload;

    const updateData = {};

    Object.keys(incoming).forEach((key) => {
      const newValue = incoming[key];
      const oldValue = existing[key];

      if (
        newValue instanceof Date &&
        new Date(oldValue).getTime() !== newValue.getTime()
      ) {
        updateData[key] = newValue;
      } else if (!(newValue instanceof Date) && newValue !== oldValue) {
        updateData[key] = newValue;
      }
    });

    let updatedOffer = existing;

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = trx.fn.now();

      const [offer] = await trx("offers")
        .where("id", id)
        .update({
          ...updateData,
          last_updated_by_type: "admin",
          last_updated_by_id: adminId,
        })
        .returning("*");

      updatedOffer = offer;
    }

    if (Array.isArray(conditions)) {
      const existingConditions = await trx("offer_conditions")
        .where("offer_id", id)
        .orderBy("id");

      const normalizedExisting = existingConditions.map((c) => ({
        condition_type: c.condition_type,
        operator: c.operator,
        value: c.value,
      }));

      const normalizedIncoming = conditions.map((c) => ({
        condition_type: c.condition_type,
        operator: c.operator,
        value: c.value,
      }));

      const conditionsChanged =
        JSON.stringify(normalizedExisting) !==
        JSON.stringify(normalizedIncoming);

      if (conditionsChanged) {
        await trx("offer_conditions").where("offer_id", id).delete();

        if (conditions.length > 0) {
          const mapped = conditions.map((c) => ({
            offer_id: id,
            condition_type: c.condition_type,
            operator: c.operator,
            value: c.value,
            last_updated_by_type: "admin",
            last_updated_by_id: adminId,
          }));

          await trx("offer_conditions").insert(mapped);
        }
      }
    }

    return updatedOffer;
  });
};

export const deleteOffer = async (id) => {
  return await db("offers").where("id", id).delete();
};

//private helper functions

async function loadOffersWithConditions() {
  const rows = await db("offers as o")
    .leftJoin("offer_conditions as c", "o.id", "c.offer_id")
    .where("o.is_active", true)
    .andWhere("o.active_from", "<=", db.fn.now())
    .andWhere("o.active_until", ">=", db.fn.now())
    .orderBy("o.priority", "asc")
    .select(
      "o.id",
      "o.title",
      "o.description",
      "o.discount_type",
      "o.discount_value",
      "o.max_discount_amount",
      "o.apply_on",
      "o.is_stackable",
      "o.priority",
      // "o.usage_limit",
      // "o.used_count",
      // "o.max_uses_per_user",
      "c.condition_type",
      "c.operator",
      "c.value",
    );

  return groupOffers(rows);
}

function groupOffers(rows) {
  const offerMap = new Map();

  for (const row of rows) {
    if (!offerMap.has(row.id)) {
      offerMap.set(row.id, {
        id: row.id,
        title: row.title,
        description: row.description,
        discount_type: row.discount_type,
        discount_value: Number(row.discount_value),
        max_discount_amount: row.max_discount_amount
          ? Number(row.max_discount_amount)
          : null,
        apply_on: row.apply_on,
        is_stackable: row.is_stackable,
        priority: row.priority,
        // usage_limit: row.usage_limit,
        // used_count: row.used_count,
        // max_uses_per_user: row.max_uses_per_user,
        conditions: [],
      });
    }

    if (row.condition_type) {
      offerMap.get(row.id).conditions.push({
        condition_type: row.condition_type,
        operator: row.operator,
        value: row.value,
      });
    }
  }

  return Array.from(offerMap.values());
}

// function passesUsageLimit(offer, userUsageCount) {
//   if (offer.usage_limit && offer.used_count >= offer.usage_limit)
//     return false;

//   if (
//     offer.max_uses_per_user &&
//     userUsageCount >= offer.max_uses_per_user
//   )
//     return false;

//   return true;
// }
function getAmountForDuration(duration, ctx) {
  let finalAmount = 0;
  let { daytime, evening } = ctx.unitDistribution;
  while (duration--) {
    if (daytime > 0) {
      finalAmount += ctx.costPerUnit;
      daytime--;
    } else if (evening > 0) {
      finalAmount += ctx.costPerUnit + ctx.evnCostPerUnit;
    }
  }
  return finalAmount;
}

function calculateDiscount(offer, state, ctx) {
  const amountToApplyOn =
    offer.apply_on === "BASE" ? state.baseTotal : state.runningTotal;

  let discount;
  switch (offer.discount_type) {
    case "PERCENT":
      discount = (amountToApplyOn * offer.discount_value) / 100;
      break;
    case "FREE_DURATION":
      discount = getAmountForDuration(Number(offer.discount_value), ctx);
      break;
    default:
      discount = Number(offer.discount_value);
  }

  // Apply max cap
  if (offer.max_discount_amount && discount > offer.max_discount_amount) {
    discount = Number(offer.max_discount_amount);
  }

  return discount;
}

function applyStackable(baseTotal, offers) {
  let state = {
    baseTotal,
    runningTotal: baseTotal,
    totalDiscount: 0,
    breakdown: [],
    appliedOffers: [],
  };

  for (const offer of offers) {
    const discount = calculateDiscount(offer, state);

    state.runningTotal -= discount;
    state.totalDiscount += discount;

    state.breakdown.push({
      label: `${offer.title}${
        offer.discount_type === "PERCENT" ? ` (${offer.discount_value}%)` : ""
      }`,
      amount: -(Math.round(discount * 100) / 100),
    });

    state.appliedOffers.push(offer.title);
  }

  return state;
}

function getBestNonStackable(baseTotal, offers, ctx) {
  let best = null;

  for (const offer of offers) {
    const state = {
      baseTotal,
      runningTotal: baseTotal,
      totalDiscount: 0,
    };

    const discount = calculateDiscount(offer, state, ctx);
    const finalTotal = baseTotal - discount;

    if (!best || discount > best.totalDiscount) {
      best = {
        baseTotal,
        runningTotal: finalTotal,
        totalDiscount: discount,
        breakdown: [
          {
            label: offer.title,
            amount: -(Math.round(discount * 100) / 100),
          },
        ],
        appliedOffers: [offer.title],
      };
    }
  }

  return best;
}

function conditionsMatch(offer, ctx) {
  for (const cond of offer.conditions) {
    const { condition_type, operator, value } = cond;

    const ctxValue = getContextValue(condition_type, ctx);

    if (!evaluateCondition(ctxValue, operator, value)) {
      return false;
    }
  }

  return true;
}

function getContextValue(type, ctx) {
  switch (type) {
    case "MIN_DURATION":
      return ctx.durationUnits;
    case "SPORT":
      return ctx.sport;
    case "BOX":
      return ctx.box;
    case "DAY_OF_WEEK":
      return ctx.dayOfWeek;
    case "TIME_RANGE":
      return ctx.startTime;
    case "END_TIME":
      return ctx.endTime;
    default:
      return null;
  }
}

function evaluateCondition(ctxValue, operator, value) {
  if (typeof ctxValue == "string") {
    ctxValue = ctxValue.toLowerCase();
  }
  if (typeof value == "string") {
    value = value.toLowerCase();
  }
  switch (operator) {
    case "=":
      return ctxValue == value;

    case ">=":
      return ctxValue >= Number(value);

    case "<=":
      return ctxValue <= Number(value);

    case "IN":
      return value
        .split(",")
        .map((v) => {
          return typeof v === "string" ? v.trim().toLowerCase() : v;
        })
        .includes(String(ctxValue));

    default:
      return false;
  }
}

function finalizeResult(state) {
  return {
    finalTotal: Math.round(state.runningTotal * 100) / 100,
    discountTotal: Math.round(state.totalDiscount * 100) / 100,
    breakdown: state.breakdown,
    appliedOffers: state.appliedOffers,
  };
}

export async function applyOffers(baseTotal, ctx) {
  const offers = await loadOffersWithConditions();

  const eligible = [];

  for (const offer of offers) {
    if (!conditionsMatch(offer, ctx)) continue;

    // if (!passesUsageLimit(offer, ctx.userUsageCount?.[offer.id] || 0)) continue;

    eligible.push(offer);
  }

  const stackable = eligible.filter((o) => o.is_stackable);
  const nonStackable = eligible.filter((o) => !o.is_stackable);

  const stackedResult = applyStackable(baseTotal, stackable);
  const bestSingle = getBestNonStackable(baseTotal, nonStackable, ctx);

  if (!bestSingle) {
    let res = finalizeResult(stackedResult);
    return res;
  }

  const better =
    bestSingle.totalDiscount > stackedResult.totalDiscount
      ? bestSingle
      : stackedResult;

  let res = finalizeResult(better);
  return res;
}
