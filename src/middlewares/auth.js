import jwt from "jsonwebtoken";
import knex from "../config/db.js";

const SECRET = process.env.JWT_SECRET;

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .json({ success: false, error: "Invalid or expired token" });
    }
    req.user = decoded; // attach user payload
    next();
  });
};

export const refreshMiddleware = async (req, res, next) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken)
    return res
      .status(400)
      .json({ success: false, error: "Refresh token required" });

  const stored = await knex("admin_refresh_tokens")
    .where({ token: refreshToken })
    .first();
  if (!stored)
    return res
      .status(403)
      .json({ success: false, error: "Invalid refresh token" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await knex("admins").where({ id: decoded.id }).first();
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });
    req.user = user;
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ success: false, error: "Invalid refresh token" });
  }
};

export function verifyApiKey(req, res, next) {
  const provided = req.header("x-api-key");
  if (!provided) {
    return res.status(401).json({ success: false, error: "Missing x-api-key" });
  }
  if (provided !== process.env.API_KEY) {
    return res.status(403).json({ success: false, error: "Invalid API key" });
  }
  return next();
}
