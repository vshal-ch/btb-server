import express from "express";
import bcrypt from "bcrypt";
import knex from "../config/db.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { refreshMiddleware } from "../middlewares/auth.js";

const authRouter = express.Router();

authRouter.post("/login", async (req, res) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid request body" });
    }
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Username and password are required" });
    }

    const user = await knex("admins").where({ username }).first();

    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const accessToken = generateAccessToken({
      id: user.id,
      username: user.username,
    });
    const refreshToken = generateRefreshToken({
      id: user.id,
      username: user.username,
    });

    await knex("admin_refresh_tokens").where('admin_id',user.id).del();
    await knex("admin_refresh_tokens").insert({
      admin_id: user.id,
      token: refreshToken,
    });

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV == "development" ? false : true,
        maxAge: 86400000,
      })
      .json({ success: true, error: "", data: { accessToken } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

authRouter.post("/refresh", refreshMiddleware, async (req, res) => {
  const newAccessToken = generateAccessToken({
    id: req.user.id,
    username: req.user.username,
  });
  res.json({ success: true, data: { accessToken: newAccessToken }, error: "" });
});

authRouter.post("/logout", async (req, res) => {
  console.log(req.cookies);

  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    console.log("No refresh token");
    return res.status(400).json({ error: "Refresh token required" });
  }

  await knex("admin_refresh_tokens").where({ token: refreshToken }).del();
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV == "development" ? false : true,
    sameSite: "Strict",
    maxAge: 86400000,
  });
  res.sendStatus(204);
});

export default authRouter;
