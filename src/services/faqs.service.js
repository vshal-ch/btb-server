import knex from "../config/db.js";

export async function getFaqs(platform) {
  return knex("faqs")
    .select("id", "question", "answer")
    .where("active", true)
    .where((qb) => {
      qb.where("platform", "all").orWhere("platform", platform);
    })
    .orderBy("display_order", "asc");
}
