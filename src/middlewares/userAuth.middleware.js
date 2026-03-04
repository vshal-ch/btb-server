import { PLATFORM_POLICY } from "../config/platform_policy.js";
import { getUser } from "../services/auth.js";
import { verifyToken } from "../utils/jwt.js";

export const requireAccessToken = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res
      .status(400)
      .json({ success: false, error: "Missing access token" });
  }

  try {
    const token = auth.split(" ")[1];
    const payload = verifyToken(token);
    const user = await getUser(payload.userId); // { userId, email }

    if (!user) {
      throw new Error("Invalid access token");
    }

    req.user = user;

    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, error: "Invalid access token" });
  }
};

export const validateProfileUpdate = (req, res, next) => {
  const { phone, name } = req.body;

  if (!phone && !name) {
    return res.status(400).json({
      success: false,
      error: "At least one of phone or name is required",
    });
  }

  if (phone !== undefined) {
    if (!phone || typeof phone !== "string") {
      return res.status(400).json({
        success: false,
        error: "Phone number is required",
      });
    }

    let normalized = phone.replace(/[\s-]/g, "");

    if (normalized.startsWith("+91")) {
      normalized = normalized.slice(3);
    } else if (normalized.startsWith("91") && normalized.length === 12) {
      normalized = normalized.slice(2);
    }

    const indianMobileRegex = /^[6-9]\d{9}$/;

    if (!indianMobileRegex.test(normalized)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Indian mobile number",
      });
    }

    req.phone = normalized;
  }

  if (name !== undefined) {
    if (typeof name !== "string") {
      return res.status(400).json({
        success: false,
        error: "Name must be a string",
      });
    }

    const trimmed = name.trim();

    if (trimmed.length < 1) {
      return res.status(400).json({
        success: false,
        error: "Name must be at least 1 character long",
      });
    }

    req.name = trimmed;
  }

  next();
};

export const extractRefreshToken = (req, res, next) => {
  try {
    const platform = req.platform;
    const policy = PLATFORM_POLICY[platform];

    if (!policy) {
      return res.status(400).json({
        success: false,
        error: "Unsupported platform",
      });
    }

    let refreshToken;

    if (policy.refreshTokenSource === "cookie") {
      refreshToken = req.cookies?.refresh_token;
    } else {
      refreshToken = req.body?.refreshToken;
    }

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Refresh token is required",
      });
    }

    // Attach server-verified values
    req.refreshToken = refreshToken;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Invalid refresh token",
    });
  }
};
