import "server-only";

import { getPool } from "@/backend/database/pool";
import { seedDevData } from "@/backend/database/seed";

let initialized = false;

export async function ensureInitialized(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // Verify database connectivity
  try {
    const pool = getPool();
    await pool.query("SELECT 1");
  } catch (err) {
    initialized = false;
    console.error("[Init] Database connection failed:", err);
    throw new Error("Database connection failed. Check DB_* environment variables.");
  }

  if (process.env.NODE_ENV !== "production") {
    await seedDevData();
  }
}
