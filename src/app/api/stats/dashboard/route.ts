import { NextResponse } from "next/server";
import { ensureInitialized } from "@/backend/database/init";
import { StatsService } from "@/backend/services/stats.service";
import { verifyToken } from "@/backend/utils";
import { Logger } from "@/backend/utils";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await ensureInitialized();

    // Auth check
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("auth-token")?.value;
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    const token = cookieToken || bearerToken;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const stats = await StatsService.getDashboard();
    Logger.debug("Stats", "Dashboard stats fetched");
    return NextResponse.json({ success: true, data: stats });
  } catch (err) {
    Logger.error("Stats", "Dashboard stats error", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
