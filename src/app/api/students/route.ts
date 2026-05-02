import { NextRequest, NextResponse } from "next/server";
import { ensureInitialized } from "@/backend/database/init";
import { query, queryOne, execute } from "@/backend/database/pool";
import { verifyToken, Logger } from "@/backend/utils";
import { cookies } from "next/headers";
import type { StudentTableRow } from "@/shared/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10))
    );
    const search = searchParams.get("search") ?? "";
    const offset = (page - 1) * limit;

    // Count
    const countResult = await queryOne<{ total: number }>(
      search
        ? `SELECT COUNT(*) AS total FROM students s
           JOIN users u ON s.userId = u.idUser
           WHERE CONCAT(u.name, ' ', u.lastName) LIKE ? OR s.registration LIKE ?`
        : "SELECT COUNT(*) AS total FROM students",
      search ? [`%${search}%`, `%${search}%`] : []
    );
    const total = countResult?.total ?? 0;

    // Fetch joined data
    const rows = await query<{
      id: number;
      name: string;
      lastName: string;
      registration: string;
      programName: string;
      cycleName: string;
      statusType: string;
    }>(
      `SELECT
         s.idStudent   AS id,
         u.name,
         u.lastName,
         s.registration,
         p.name        AS programName,
         sc.cycle      AS cycleName,
         st.type       AS statusType
       FROM students s
       JOIN users u          ON s.userId = u.idUser
       JOIN programs p       ON s.programId = p.idProgram
       JOIN schoolCycles sc  ON s.enrollmentCycleId = sc.idCycle
       JOIN statusCatalog st ON s.statusId = st.idStatus
       ${search ? "WHERE CONCAT(u.name, ' ', u.lastName) LIKE ? OR s.registration LIKE ?" : ""}
       ORDER BY u.lastName, u.name
       LIMIT ? OFFSET ?`,
      search
        ? [`%${search}%`, `%${search}%`, limit, offset]
        : [limit, offset]
    );

    const data: StudentTableRow[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      lastName: r.lastName,
      initials:
        (r.name.charAt(0) + r.lastName.charAt(0)).toUpperCase(),
      registration: r.registration,
      programName: r.programName,
      cycleName: r.cycleName,
      statusType: r.statusType,
    }));

    Logger.debug("Students", `Listed page ${page}, ${data.length} rows`);

    return NextResponse.json({
      success: true,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    Logger.error("Students", "List error", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── POST /api/students — Inscripción ──────────────────────────────────────────

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
    const { name, lastName, curp, registration, cycleId, programId, coordinadorId, directorId } = body;

    if (!name || !lastName || !curp || !registration || !cycleId || !programId || !coordinadorId || !directorId) {
      return NextResponse.json(
        { success: false, error: "All fields are required: name, lastName, curp, registration, cycleId, programId, coordinadorId, directorId" },
        { status: 400 }
      );
    }

    // Find or create "Estudiante" role
    let role = await queryOne<{ idRole: number }>(
      "SELECT idRole FROM userRoles WHERE role = 'Estudiante'",
      []
    );
    if (!role) {
      const roleResult = await execute(
        "INSERT INTO userRoles (role) VALUES ('Estudiante')",
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

    // Find "INSCRITO" status
    let status = await queryOne<{ idStatus: number }>(
      "SELECT idStatus FROM statusCatalog WHERE type = 'INSCRITO'",
      []
    );
    if (!status) {
      const statusResult = await execute(
        "INSERT INTO statusCatalog (type) VALUES ('INSCRITO')",
        []
      );
      status = { idStatus: statusResult.insertId };
    }

    // Create student
    const studentResult = await execute(
      `INSERT INTO students (userId, curp, registration, timeModality, programId, localTutorId, academicDirectorId, enrollmentCycleId, semester, statusId)
       VALUES (?, ?, ?, 'TC', ?, ?, ?, ?, 1, ?)`,
      [userId, curp, registration, programId, coordinadorId, directorId, cycleId, status.idStatus]
    );

    Logger.debug("Students", `POST created student ${studentResult.insertId}`);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: studentResult.insertId,
          userId,
          name,
          lastName,
          curp,
          registration,
          programId,
          enrollmentCycleId: cycleId,
          localTutorId: coordinadorId,
          academicDirectorId: directorId,
          statusId: status.idStatus,
          semester: 1,
          timeModality: "TC",
        },
      },
      { status: 201 }
    );
  } catch (err) {
    Logger.error("Students", "POST error", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
