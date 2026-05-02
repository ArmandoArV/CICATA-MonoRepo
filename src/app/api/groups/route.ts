import { NextRequest, NextResponse } from "next/server";
import { ensureInitialized } from "@/backend/database/init";
import { query, queryOne, execute } from "@/backend/database/pool";
import { verifyToken, Logger } from "@/backend/utils";
import { cookies } from "next/headers";
import type { GroupTableRow } from "@/shared/types";

export const runtime = "nodejs";

async function authenticate(req: NextRequest) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("auth-token")?.value;
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = cookieToken || bearerToken;
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(req: NextRequest) {
  try {
    await ensureInitialized();
    const payload = await authenticate(req);
    if (!payload) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { groupKey, subjectId, campus, place, schedule, professorId, cycleId, observations } = body;

    if (!groupKey || !subjectId || !professorId || !cycleId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const result = await execute(
      `INSERT INTO studyGroups (groupKey, subjectId, campus, place, schedule, professorId, cycleId, observations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [groupKey, subjectId, campus || "CICATA MORELOS", place || "", schedule || null, professorId, cycleId, observations || null]
    );

    Logger.debug("Groups", `Created group ${result.insertId}`);
    return NextResponse.json({ success: true, data: { id: result.insertId } }, { status: 201 });
  } catch (err) {
    Logger.error("Groups", "Create error", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureInitialized();
    const payload = await authenticate(req);
    if (!payload) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
    const search = searchParams.get("search") ?? "";
    const offset = (page - 1) * limit;

    const countResult = await queryOne<{ total: number }>(
      search
        ? `SELECT COUNT(*) AS total FROM studyGroups g
           JOIN subjects s ON g.subjectId = s.idSubject
           WHERE g.groupKey LIKE ? OR s.name LIKE ?`
        : "SELECT COUNT(*) AS total FROM studyGroups",
      search ? [`%${search}%`, `%${search}%`] : []
    );
    const total = countResult?.total ?? 0;

    const rows = await query<GroupTableRow>(
      `SELECT
         g.idGroup     AS id,
         g.groupKey,
         s.name        AS subjectName,
         CONCAT(u.name, ' ', u.lastName) AS professorName,
         g.campus,
         g.place,
         g.schedule,
         sc.cycle      AS cycleName
       FROM studyGroups g
       JOIN subjects s       ON g.subjectId = s.idSubject
       JOIN professors pr    ON g.professorId = pr.idProfessor
       JOIN users u          ON pr.userId = u.idUser
       JOIN schoolCycles sc  ON g.cycleId = sc.idCycle
       ${search ? "WHERE g.groupKey LIKE ? OR s.name LIKE ?" : ""}
       ORDER BY g.groupKey
       LIMIT ? OFFSET ?`,
      search ? [`%${search}%`, `%${search}%`, limit, offset] : [limit, offset]
    );

    Logger.debug("Groups", `Listed page ${page}, ${rows.length} rows`);

    return NextResponse.json({
      success: true,
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    Logger.error("Groups", "List error", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
