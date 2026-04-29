import { NextRequest } from "next/server";
import { AuthController } from "@/backend/controllers";
import { ensureInitialized } from "@/backend/database/init";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await ensureInitialized();
  return AuthController.me(request);
}
