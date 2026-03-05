import { createClient } from "redis";
import { readFileSync } from "fs";
import { log } from "console";
import AppError from "./AppError.js";

const SLOT_LOCK_TTL_SECONDS = process.env.SLOT_LOCK_TTL_SECONDS || 600;

const redis = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});

const lockSlotLuaScript = {
  file: readFileSync(process.env.ATOMIC_LOCK_LUA_PATH, "utf8"),
  sha: null,
};

redis.on("connect", async () => {
  console.log("✅ Redis connected");
  try {
    const sha = await redis.scriptLoad(lockSlotLuaScript.file);
    lockSlotLuaScript.sha = sha;
  } catch (e) {
    throw new Error("Error while loading lua script ", e.message);
  }
});

redis.on("error", (err) => {
  console.error("❌ Redis error", err);
  throw new Error("Error while connecting redis!", err.message);
});

const SLOT_START_HOUR = 6; // 6 AM
const SLOT_END_HOUR = 24; // 12 AM
const SLOT_SIZE_MIN = 30;

const TOTAL_SLOTS = ((SLOT_END_HOUR - SLOT_START_HOUR) * 60) / SLOT_SIZE_MIN;
// = 36

export async function getLockedSlots(box, date) {
  const pipeline = redis.multi();

  for (let i = 0; i < TOTAL_SLOTS; i++) {
    pipeline.get(`slot:${box}:${date}:${i}`);
  }

  const results = await pipeline.execAsPipeline();

  let lastBookingId = null;
  let lastStartUnit = null;
  let lastVal = null;

  const lockedSlots = [];

  for (let i = 0; i < results.length; i++) {
    const rawVal = results[i];

    if (!rawVal) {
      if (lastStartUnit != null) {
        lockedSlots.push({
          id: lastBookingId,
          sport: lastVal.sport,
          start_time: lastStartUnit,
          end_time: i,
          box,
          date,
        });
        lastBookingId = null;
        lastStartUnit = null;
        lastVal = null;
      }
      continue;
    }

    const val = JSON.parse(rawVal);

    if (lastBookingId == null) {
      lastBookingId = val.booking_id;
      lastStartUnit = i;
      lastVal = val;
      continue;
    }

    if (val.booking_id !== lastBookingId) {
      lockedSlots.push({
        id: lastBookingId,
        sport: lastVal.sport,
        start_time: lastStartUnit,
        end_time: i, // ✅ exclusive
        box,
        date,
      });

      lastBookingId = val.booking_id;
      lastStartUnit = i;
      lastVal = val;
    }
  }

  if (lastStartUnit != null) {
    lockedSlots.push({
      id: lastBookingId,
      sport: lastVal.sport,
      start_time: lastStartUnit,
      end_time: TOTAL_SLOTS,
      box,
      date,
    });
  }

  return lockedSlots;
}

export async function checkRedisLockedSlots({ box, date, startTime, endTime }) {
  const keys = [];

  for (let unit = startTime; unit < endTime; unit++) {
    keys.push(`slot:${box}:${date}:${unit}`);
  }

  const results = await redis.mGet(keys);

  for (let i = 0; i < results.length; i++) {
    if (results[i] !== null) {
      throw new AppError(`Slot is already locked at the selected time!`, 400);
    }
  }
}

export async function lockSlots({ box, date, startTime, endTime }, value) {
  const keys = buildSlotKeys({ box, date, startTime, endTime });

  const result = await redis.evalSha(lockSlotLuaScript.sha, {
    keys,
    arguments: [String(SLOT_LOCK_TTL_SECONDS), JSON.stringify(value)],
  });
  return result;
}

export async function releaseSlotLock(slotData) {
  const keys = buildSlotKeys(slotData);
  if (keys.length) {
    await redis.del(keys);
  }
}

function buildSlotKeys({ box, date, startTime, endTime }) {
  const keys = [];
  for (let slot = startTime; slot < endTime; slot++) {
    keys.push(`slot:${box}:${date}:${slot}`);
  }
  return keys;
}

await redis.connect();

export default redis;
