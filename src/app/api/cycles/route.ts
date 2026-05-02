import { NextRequest, NextResponse } from "next/server";
import { ensureInitialized } from "@/backend/database/init";
import { query } from "@/backend/database/pool";
import { verifyToken, Logger } from "@/backend/utils";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await ensureInitialized();

    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("auth-token")?.value;
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const token = cookieToken || bearerToken;

    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

    const rows = await query<{ id: number; cycle: string }>(
      "SELECT idCycle AS id, cycle FROM schoolCycles ORDER BY startDate DESC"
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    Logger.error("Cycles", "List error", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
