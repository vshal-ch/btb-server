import knex from "../config/db.js";
import { PLATFORM_POLICY } from "../config/platform_policy.js";
import {
  generateAccessToken,
  generateUserRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { OAuth2Client } from "google-auth-library";
import { logAuthEvent } from "./authLog.js";

const googleClient = new OAuth2Client();

export const getUser = async (userId) => {
  const user = await knex("users")
    .select("id", "name", "email", "new_user", "phone_no", "avatar_url")
    .where({ id: userId })
    .first();
  return user;
};

export const loginWithGoogle = async (req) => {
  const { idToken, platform } = req;
  let ticket;

  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_ALLOWED_CLIENT_IDS.split(",").map((v) =>
        v.trim(),
      ),
    });
  } catch (e) {
    console.log(e);
    throw new Error("Invalid Google ID Token!");
  }

  const payload = ticket.getPayload();
  const { sub, email, name, picture } = payload;

  return await knex.transaction(async (trx) => {
    let oauth = await trx("oauth_accounts")
      .where({ provider: "google", provider_user_id: sub })
      .first();

    let user;

    if (!oauth) {
      const [newUser] = await trx("users")
        .insert({
          email,
          name,
          avatar_url: picture,
        })
        .returning("*");

      await trx("oauth_accounts").insert({
        user_id: newUser.id,
        provider: "google",
        provider_user_id: sub,
      });

      user = newUser;
    } else {
      user = await trx("users").where({ id: oauth.user_id }).first();
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = generateUserRefreshToken(
      { userId: user.id },
      PLATFORM_POLICY[platform].refreshTtlDays,
    );

    await trx("user_refresh_tokens").insert({
      user_id: user.id,
      platform: platform,
      token: refreshToken,
      expires_at: trx.raw(
        `now() + interval '${PLATFORM_POLICY[platform].refreshTtlDays} days'`,
      ),
    });

    await trx("auth_logs").insert({
      user_id: user.id,
      event: "LOGIN",
      platform,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });

    return { accessToken, refreshToken, user };
  });
};

export const updatePhone = async (userId, updates) => {
  const updateData = {};

  if (updates.phone !== undefined) {
    updateData.phone_no = updates.phone;
  }

  if (updates.name !== undefined) {
    updateData.name = updates.name;
  }

  updateData.new_user = false;

  const [updatedUser] = await knex("users")
    .where({ id: userId })
    .update(updateData, [
      "id",
      "name",
      "email",
      "new_user",
      "phone_no",
      "avatar_url",
    ]);

  return updatedUser;
};

export const refreshSession = async ({ refreshToken, platform }, res) => {
  const policy = PLATFORM_POLICY[platform];
  const payload = verifyRefreshToken(refreshToken);

  const tokenRow = await knex("user_refresh_tokens")
    .where({ user_id: payload.userId, token: refreshToken, platform })
    .andWhere("expires_at", ">", knex.fn.now())
    .first();

  if (!tokenRow) throw new Error("Invalid refresh token");

  const accessToken = generateAccessToken({
    userId: payload.userId,
  });

  const expiresInMs = new Date(tokenRow.expires_at) - new Date();
  const shouldSlide =
    expiresInMs < policy.slideThresholdDays * 24 * 60 * 60 * 1000;

  if (!shouldSlide) {
    return { accessToken };
  }

  await knex("user_refresh_tokens").where({ id: tokenRow.id }).del();

  const newRefreshToken = generateUserRefreshToken(
    { userId: payload.userId },
    policy.refreshTtlDays,
  );

  await knex("user_refresh_tokens").insert({
    user_id: payload.userId,
    token: newRefreshToken,
    platform,
    expires_at: knex.raw(`now() + interval '${policy.refreshTtlDays} days'`),
  });

  if (policy.refreshTokenSource === "cookie") {
    res.cookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 14 * 86400000,
    });

    return { accessToken };
  }

  return { accessToken, refreshToken: newRefreshToken };
};

export const logout = async (req) => {
  console.log(req.refreshToken);
  await knex("user_refresh_tokens").where({ token: req.refreshToken }).del();
  logAuthEvent({
    userId: req.user.userId,
    event: "LOGOUT",
    platform: req.platform,
    req: req,
  });
};

export const logoutAll = async (req) => {
  await knex("user_refresh_tokens").where({ user_id: req.user.userId }).del();
  logAuthEvent({
    userId: req.user.userId,
    event: "LOGOUT-ALL",
    platform: req.platform,
    req: req,
  });
};
