import { NextRequest, NextResponse } from "next/server";
import { ensureInitialized } from "@/backend/database/init";
import { query, queryOne, execute } from "@/backend/database/pool";
import { verifyToken, Logger } from "@/backend/utils";
import { cookies } from "next/headers";

export const runtime = "nodejs";

async function authenticate(req: NextRequest) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("auth-token")?.value;
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  const token = cookieToken || bearerToken;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload ? token : null;
}

// ── GET /api/professors/[id] ──────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInitialized();
    const token = await authenticate(req);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const profId = parseInt(id, 10);
    if (isNaN(profId)) {
      return NextResponse.json(
        { success: false, error: "Invalid professor ID" },
        { status: 400 }
      );
    }

    const prof = await queryOne<{
      id: number;
      name: string;
      lastName: string;
      ipnRegistration: string | null;
      employeeNumber: string;
      academicLoad: number;
      availableHours: number;
      programId: number;
      programName: string;
      statusType: string;
      cycleName: string | null;
    }>(
      `SELECT
         p.idProfessor AS id, u.name, u.lastName,
         p.ipnRegistration, p.employeeNumber,
         p.academicLoad, p.availableHours,
         p.programId, pr.name AS programName,
         st.type AS statusType,
         (SELECT sc.cycle FROM schoolCycles sc ORDER BY sc.idCycle DESC LIMIT 1) AS cycleName
       FROM professors p
       JOIN users u ON p.userId = u.idUser
       JOIN programs pr ON p.programId = pr.idProgram
       JOIN statusCatalog st ON p.statusId = st.idStatus
       WHERE p.idProfessor = ?`,
      [profId]
    );

    if (!prof) {
      return NextResponse.json(
        { success: false, error: "Professor not found" },
        { status: 404 }
      );
    }

    // Get assigned groups
    const groups = await query<{ groupKey: string }>(
      `SELECT sg.groupKey
       FROM studyGroups sg
       WHERE sg.professorId = ?
       ORDER BY sg.groupKey`,
      [profId]
    );

    Logger.debug("Professors", `GET professor ${profId}`);

    return NextResponse.json({
      success: true,
      data: {
        ...prof,
        groups: groups.map((g) => g.groupKey),
      },
    });
  } catch (err) {
    Logger.error("Professors", "GET by ID error", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── PUT /api/professors/[id] ──────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInitialized();
    const token = await authenticate(req);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const profId = parseInt(id, 10);
    if (isNaN(profId)) {
      return NextResponse.json(
        { success: false, error: "Invalid professor ID" },
        { status: 400 }
      );
    }

    const existing = await queryOne<{ idProfessor: number; userId: number }>(
      "SELECT idProfessor, userId FROM professors WHERE idProfessor = ?",
      [profId]
    );
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Professor not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, lastName, ipnRegistration, employeeNumber, academicLoad, programId } = body;

    // Update user fields
    const userFields: string[] = [];
    const userValues: (string | number)[] = [];
    if (name !== undefined) { userFields.push("name = ?"); userValues.push(name); }
    if (lastName !== undefined) { userFields.push("lastName = ?"); userValues.push(lastName); }

    if (userFields.length > 0) {
      userValues.push(existing.userId);
      await execute(
        `UPDATE users SET ${userFields.join(", ")} WHERE idUser = ?`,
        userValues
      );
    }

    // Update professor fields
    const profFields: string[] = [];
    const profValues: (string | number)[] = [];
    if (ipnRegistration !== undefined) { profFields.push("ipnRegistration = ?"); profValues.push(ipnRegistration); }
    if (employeeNumber !== undefined) { profFields.push("employeeNumber = ?"); profValues.push(employeeNumber); }
    if (academicLoad !== undefined) {
      profFields.push("academicLoad = ?");
      profValues.push(academicLoad);
      profFields.push("availableHours = ?");
      profValues.push(academicLoad);
    }
    if (programId !== undefined) { profFields.push("programId = ?"); profValues.push(programId); }

    if (profFields.length > 0) {
      profValues.push(profId);
      await execute(
        `UPDATE professors SET ${profFields.join(", ")} WHERE idProfessor = ?`,
        profValues
      );
    }

    Logger.debug("Professors", `PUT professor ${profId}`);

    return NextResponse.json({ success: true, message: "Profesor actualizado" });
  } catch (err) {
    Logger.error("Professors", "PUT error", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── DELETE /api/professors/[id] ───────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInitialized();
    const token = await authenticate(req);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const profId = parseInt(id, 10);
    if (isNaN(profId)) {
      return NextResponse.json(
        { success: false, error: "Invalid professor ID" },
        { status: 400 }
      );
    }

    const existing = await queryOne<{ idProfessor: number }>(
      "SELECT idProfessor FROM professors WHERE idProfessor = ?",
      [profId]
    );
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Professor not found" },
        { status: 404 }
      );
    }

    let status = await queryOne<{ idStatus: number }>(
      "SELECT idStatus FROM statusCatalog WHERE type = 'DESHABILITADO'",
      []
    );
    if (!status) {
      status = await queryOne<{ idStatus: number }>(
        "SELECT idStatus FROM statusCatalog WHERE type = 'BAJA DEFINITIVA'",
        []
      );
    }
    if (!status) {
      return NextResponse.json(
        { success: false, error: "No deactivation status found" },
        { status: 500 }
      );
    }

    await execute(
      "UPDATE professors SET statusId = ? WHERE idProfessor = ?",
      [status.idStatus, profId]
    );

    Logger.debug("Professors", `DELETE (soft) professor ${profId}`);

    return NextResponse.json({
      success: true,
      message: "Profesor dado de baja",
    });
  } catch (err) {
    Logger.error("Professors", "DELETE error", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
