import { NextRequest, NextResponse } from "next/server";
import { ensureInitialized } from "@/backend/database/init";
import { query, queryOne } from "@/backend/database/pool";
import { verifyToken, Logger } from "@/backend/utils";
import { cookies } from "next/headers";
import type { SubjectTableRow } from "@/shared/types";

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

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
    const search = searchParams.get("search") ?? "";
    const offset = (page - 1) * limit;

    const countResult = await queryOne<{ total: number }>(
      search
        ? "SELECT COUNT(*) AS total FROM subjects WHERE name LIKE ? OR subjectKey LIKE ?"
        : "SELECT COUNT(*) AS total FROM subjects",
      search ? [`%${search}%`, `%${search}%`] : []
    );
    const total = countResult?.total ?? 0;

    const rows = await query<SubjectTableRow>(
      `SELECT idSubject AS id, name, subjectKey, credits, semester
       FROM subjects
       ${search ? "WHERE name LIKE ? OR subjectKey LIKE ?" : ""}
       ORDER BY name
       LIMIT ? OFFSET ?`,
      search ? [`%${search}%`, `%${search}%`, limit, offset] : [limit, offset]
    );

    Logger.debug("Subjects", `Listed page ${page}, ${rows.length} rows`);

    return NextResponse.json({
      success: true,
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    Logger.error("Subjects", "List error", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
