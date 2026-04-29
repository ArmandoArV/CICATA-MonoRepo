import { NextRequest } from "next/server";
import { AuthController } from "@/backend/controllers";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return AuthController.me(request);
}
