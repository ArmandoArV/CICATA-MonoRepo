import { NextRequest } from "next/server";
import { AuthController } from "@/backend/controllers";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return AuthController.register(request);
}
