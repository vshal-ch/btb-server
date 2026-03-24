import app from "./app.js";
import env_vars from "./config/env.js";
import db from "./config/db.js";
import redis from "./utils/redisClient.js";
import { loadHolidays } from "./cache/holidays.js";
// import ngrok, { listen } from "@ngrok/ngrok";

async function start() {
  try {
    // Test DB on startup
    await redis.ping();
    await db.raw("SELECT 1");
    await loadHolidays();
    console.log("✅ Connected to Postgres");
  } catch (e) {
    console.error("❌ Failed to connect to Postgres|Redis:", e.message);
  }

  app.listen(env_vars.port, "0.0.0.0", () => {
    console.log(`🚀 Server listening on http://localhost:${env_vars.port}`);
  });

  // ngrok
  //   .connect({ addr: env_vars.port, authtoken: process.env.NGROK_AUTHTOKEN })
  //   .then((listener) => console.log(`Ingress established at: ${listener.url()}`));
}

start();
