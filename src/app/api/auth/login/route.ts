import { NextRequest } from "next/server";
import { AuthController } from "@/backend/controllers";
import { ensureInitialized } from "@/backend/database/init";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  await ensureInitialized();
  return AuthController.login(request);
}
