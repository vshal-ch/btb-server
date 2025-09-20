import app from "./app.js";
import dotenv from "dotenv";
import db from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    // Test DB on startup
    await db.raw("SELECT 1");
    console.log("✅ Connected to Postgres");
  } catch (e) {
    console.error("❌ Failed to connect to Postgres:", e.message);
  }

  app.listen(PORT,"0.0.0.0", () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
  });
}

start();
