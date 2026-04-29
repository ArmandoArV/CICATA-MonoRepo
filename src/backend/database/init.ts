import "server-only";

import { seedDevData } from "@/backend/database/seed";

let initialized = false;

export async function ensureInitialized(): Promise<void> {
  if (initialized) return;
  initialized = true;

  if (process.env.NODE_ENV !== "production") {
    await seedDevData();
  }
}
