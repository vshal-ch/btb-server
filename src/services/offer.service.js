import db from "../config/db.js";

export async function applyOffers(baseTotal, ctx) {
  let total = baseTotal;
  const breakdown = [];
  const applied = [];

  const offers = await db("offers")
    .where("is_active", true)
    .andWhere("active_from", "<=", ctx.date.toISOString())
    .andWhere("active_until", ">=", ctx.date.toISOString())
    .orderBy("priority", "asc");

  //todo: implement condtionmatch
  for (const offer of offers) {
    // if (!conditionsMatch(offer, ctx)) continue

    const discount =
      offer.discount_type === "PERCENT"
        ? (total * offer.discount_value) / 100
        : offer.discount_value;

    total -= discount;
    breakdown.push({
      label: `${offer.title}${offer.discount_type === "PERCENT" ? "(" + offer.discount_value + "%)" : ""}`,
      amount: -discount,
    });

    applied.push(offer.title);

    if (!offer.is_stackable) break;
  }

  return {
    finalTotal: Math.round(total),
    offerBreakdown: breakdown,
    appliedOffers: applied,
  };
}
