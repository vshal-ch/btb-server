import app from "./app.js";
import env_vars from "./config/env.js";
import db from "./config/db.js";


async function start() {
  try {
    // Test DB on startup
    await db.raw("SELECT 1");
    console.log("✅ Connected to Postgres");
  } catch (e) {
    console.error("❌ Failed to connect to Postgres:", e.message);
  }

  app.listen(env_vars.port, "0.0.0.0", () => {
    console.log(`🚀 Server listening on http://localhost:${env_vars.port}`);
  });
}

start();
