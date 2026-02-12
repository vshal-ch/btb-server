import { VALID_PLATFORM } from "../config/platform_policy.js";

export function extractPlatform(req, res, next) {
  const raw = req.headers["x-platform"];

  if (!raw) {
    return res.status(400).json({
      error: "Missing essential headers",
      success: false,
    });
  }

  const platform = Number(raw);

  if (!VALID_PLATFORM[platform]) {
    return res.status(400).json({
      error: "Invalid X-Platform header",
      success: false,
    });
  }

  req.platform = VALID_PLATFORM[platform];

  next();
}
