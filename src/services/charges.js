import db from "../config/db.js";

export async function applyCharges(baseTotal) {
  let state = {
    baseTotal,
    runningTotal: baseTotal,
    totalCharge: 0,
    breakdown: [],
  };

  const charges = await db("charges")
    .where("is_active", true)
    .orderBy("priority", "asc");

  for (const charge of charges) {
    const amountToApplyOn =
      charge.apply_on === "BASE" ? state.baseTotal : state.runningTotal;

    let amount =
      charge.charge_type === "PERCENT"
        ? (amountToApplyOn * charge.charge_value) / 100
        : Number(charge.charge_value);

    state.runningTotal += amount;
    state.totalCharge += amount;

    state.breakdown.push({
      label:
        `${charge.title}` +
        (charge.charge_type === "PERCENT" ? ` (${charge.charge_value}%)` : ""),
      amount: Math.round(amount),
    });
  }

  return {
    finalTotal: Math.round(state.runningTotal),
    totalCharge: Math.round(state.totalCharge),
    chargeBreakdown: state.breakdown,
  };
}

export const getCharges = async () => {
  return await db("charges")
    .select(
      "id",
      "title",
      "charge_type",
      "charge_value",
      "active_from",
      "active_until",
      "priority",
      "is_active",
      "apply_on",
    )
    .orderBy("priority", "asc")
    .orderBy("created_at", "desc");
};

export const createCharge = async (payload, adminId) => {
  const [charge] = await db("charges")
    .insert({
      ...payload,
      created_by_type: "admin",
      created_by_id: adminId,
    })
    .returning("*");

  return charge;
};

export const updateCharge = async (id, payload, adminId) => {
  const existing = await db("charges").where("id", id).first();

  if (!existing) {
    throw new Error("Charge not found");
  }

  const updateData = {};

  Object.keys(payload).forEach((key) => {
    const newValue = payload[key];
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

  let updatedCharge = existing;

  if (Object.keys(updateData).length > 0) {
    updateData.updated_at = db.fn.now();

    const [charge] = await db("charges")
      .where("id", id)
      .update({
        ...updateData,
        last_updated_by_type: "admin",
        last_updated_by_id: adminId,
      })
      .returning("*");

    updatedCharge = charge;
  }

  return updatedCharge;
};

export const deleteCharge = async (id) => {
  return await db("charges").where("id", id).delete();
};
