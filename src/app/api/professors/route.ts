import { NextRequest, NextResponse } from "next/server";
import { ensureInitialized } from "@/backend/database/init";
import { query, queryOne, execute } from "@/backend/database/pool";
import { verifyToken, Logger } from "@/backend/utils";
import { cookies } from "next/headers";
import type { ProfessorTableRow } from "@/shared/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await ensureInitialized();

    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("auth-token")?.value;
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    const token = cookieToken || bearerToken;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
    const search = searchParams.get("search") ?? "";
    const offset = (page - 1) * limit;

    const countResult = await queryOne<{ total: number }>(
      search
        ? `SELECT COUNT(*) AS total FROM professors pr
           JOIN users u ON pr.userId = u.idUser
           WHERE CONCAT(u.name, ' ', u.lastName) LIKE ? OR pr.employeeNumber LIKE ?`
        : "SELECT COUNT(*) AS total FROM professors",
      search ? [`%${search}%`, `%${search}%`] : []
    );
    const total = countResult?.total ?? 0;

    const rows = await query<{
      id: number;
      name: string;
      lastName: string;
      academicDegree: string | null;
      employeeNumber: string;
      programName: string;
      academicLoad: number;
      statusType: string;
    }>(
      `SELECT
         pr.idProfessor AS id,
         u.name,
         u.lastName,
         u.academicDegree,
         pr.employeeNumber,
         p.name        AS programName,
         pr.academicLoad,
         st.type       AS statusType
       FROM professors pr
       JOIN users u          ON pr.userId = u.idUser
       JOIN programs p       ON pr.programId = p.idProgram
       JOIN statusCatalog st ON pr.statusId = st.idStatus
       ${search ? "WHERE CONCAT(u.name, ' ', u.lastName) LIKE ? OR pr.employeeNumber LIKE ?" : ""}
       ORDER BY u.lastName, u.name
       LIMIT ? OFFSET ?`,
      search ? [`%${search}%`, `%${search}%`, limit, offset] : [limit, offset]
    );

    const data: ProfessorTableRow[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      lastName: r.lastName,
      initials: (r.name.charAt(0) + r.lastName.charAt(0)).toUpperCase(),
      academicDegree: r.academicDegree,
      employeeNumber: r.employeeNumber,
      programName: r.programName,
      academicLoad: r.academicLoad,
      statusType: r.statusType,
    }));

    Logger.debug("Professors", `Listed page ${page}, ${data.length} rows`);

    return NextResponse.json({
      success: true,
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    Logger.error("Professors", "List error", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ── POST /api/professors — Inscripción ────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    await ensureInitialized();

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

    const body = await req.json();
    const { name, lastName, ipnRegistration, employeeNumber, academicLoad, programId } = body;

    if (!name || !lastName || !employeeNumber || !academicLoad || !programId) {
      return NextResponse.json(
        { success: false, error: "Required fields: name, lastName, employeeNumber, academicLoad, programId" },
        { status: 400 }
      );
    }

    // Find or create "Profesor" role
    let role = await queryOne<{ idRole: number }>(
      "SELECT idRole FROM userRoles WHERE role = 'Profesor'",
      []
    );
    if (!role) {
      const roleResult = await execute(
        "INSERT INTO userRoles (role) VALUES ('Profesor')",
        []
      );
      role = { idRole: roleResult.insertId };
    }

    // Create user
    const userResult = await execute(
      "INSERT INTO users (name, lastName, roleId, gender) VALUES (?, ?, ?, 'X')",
      [name, lastName, role.idRole]
    );
    const userId = userResult.insertId;

    // Find ACTIVO status
    let status = await queryOne<{ idStatus: number }>(
      "SELECT idStatus FROM statusCatalog WHERE type = 'ACTIVO'",
      []
    );
    if (!status) {
      const statusResult = await execute(
        "INSERT INTO statusCatalog (type) VALUES ('ACTIVO')",
        []
      );
      status = { idStatus: statusResult.insertId };
    }

    // Create professor
    const profResult = await execute(
      `INSERT INTO professors (userId, ipnRegistration, employeeNumber, academicLoad, availableHours, programId, statusId)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, ipnRegistration || null, employeeNumber, academicLoad, academicLoad, programId, status.idStatus]
    );

    Logger.debug("Professors", `POST created professor ${profResult.insertId}`);

    return NextResponse.json({
      success: true,
      data: { id: profResult.insertId, userId },
    });
  } catch (err) {
    Logger.error("Professors", "POST error", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
