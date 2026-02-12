import express from "express";
import {
  loginWithGoogle,
  logout,
  logoutAll,
  refreshSession,
  updatePhone,
} from "../services/auth.js";
import { PLATFORM_POLICY } from "../config/platform_policy.js";
import {
  extractRefreshToken,
  requireAccessToken,
  validateProfileUpdate,
} from "../middlewares/userAuth.middleware.js";

const authRouter = express.Router();

authRouter.post("/validate", requireAccessToken, async (req, res, next) => {
  res.json({
    success: true,
    data: { ...req.user },
  });
});

authRouter.post("/google", async (req, res, next) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid request body" });
    }
    const { idToken } = req.body;

    if (!idToken) {
      return res
        .status(400)
        .json({ success: false, error: "ID token is required" });
    }
    req.idToken = req.body.idToken;
    const platform = req.platform;
    const { accessToken, refreshToken, user } = await loginWithGoogle(req);

    if (PLATFORM_POLICY[platform].refreshTokenSource === "cookie") {
      res
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
          sameSite: "strict",
          secure: process.env.NODE_ENV === "development" ? false : true,
          maxAge: 14 * 86400000,
        })
        .json({ success: true, data: { accessToken, user }, error: "" });
    } else if (PLATFORM_POLICY[platform].refreshTokenSource === "json") {
      res.json({
        success: true,
        data: { accessToken, refreshToken, user },
        error: "",
      });
    }
  } catch (e) {
    next(e);
  }
});

authRouter.post(
  "/complete",
  requireAccessToken,
  validateProfileUpdate,
  async (req, res, next) => {
    try {
      const user = req.user;
      const { phone, name } = req;

      const updatedUser = await updatePhone(user.id, { phone, name });

      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          error: "Failed to update phone number",
        });
      }

      return res.json({
        success: true,
        data: updatedUser,
      });
    } catch (err) {
      next(err);
    }
  },
);

authRouter.post("/refresh", extractRefreshToken, async (req, res, next) => {
  try {
    const result = await refreshSession(req, res);
    console.log(result);

    res.json({ success: true, data: result });
  } catch (e) {
    console.log(e);

    next(e);
  }
});

authRouter.post(
  "/logout",
  requireAccessToken,
  extractRefreshToken,
  async (req, res) => {
    try {
      await logout(req);
      console.log("Deleted refresh token from db");

      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV == "development" ? false : true,
        sameSite: "Strict",
        maxAge: 14 * 86400000,
      });
      res.sendStatus(204);
    } catch (e) {
      next(e);
    }
  },
);

authRouter.post("/logout-all", requireAccessToken, async (req, res) => {
  await logoutAll(req);
  res.json({ success: true });
});

export default authRouter;
