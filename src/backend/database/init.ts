import "server-only";

import { getPool } from "@/backend/database/pool";
import { seedDevData } from "@/backend/database/seed";
import { Logger } from "@/backend/utils";

let initialized = false;

export async function ensureInitialized(): Promise<void> {
  if (initialized) return;
  initialized = true;

  try {
    const pool = getPool();
    await pool.query("SELECT 1");
    Logger.info("Init", "Database connected");
  } catch (err) {
    initialized = false;
    Logger.error("Init", "Database connection failed", err);
    throw new Error("Database connection failed. Check DB_* environment variables.");
  }

  if (process.env.NODE_ENV !== "production") {
    await seedDevData();
  }
}
