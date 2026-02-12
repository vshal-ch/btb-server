import knex from "../config/db.js";

export const logAuthEvent = async ({ userId, event, platform, req }) => {
  knex("auth_logs").insert({
    user_id: userId,
    event,
    platform,
    ip_address: req.ip,
    user_agent: req.headers["user-agent"],
  });
};
