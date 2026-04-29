import { AuthController } from "@/backend/controllers";

export const runtime = "nodejs";

export async function POST() {
  return AuthController.logout();
}
