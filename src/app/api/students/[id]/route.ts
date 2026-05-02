import { NextRequest, NextResponse } from "next/server";
import { ensureInitialized } from "@/backend/database/init";
import { query, queryOne, execute } from "@/backend/database/pool";
import { verifyToken, Logger } from "@/backend/utils";
import { cookies } from "next/headers";

export const runtime = "nodejs";

// ── GET /api/students/[id] ────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const studentId = parseInt(id, 10);
    if (isNaN(studentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid student ID" },
        { status: 400 }
      );
    }

    const student = await queryOne<{
      id: number;
      name: string;
      lastName: string;
      curp: string;
      registration: string;
      timeModality: string;
      semester: number;
      programId: number;
      programName: string;
      enrollmentCycleId: number;
      cycleName: string;
      statusId: number;
      statusType: string;
      directorName: string | null;
      directorLastName: string | null;
      coordinadorName: string | null;
      coordinadorLastName: string | null;
    }>(
      `SELECT
         s.idStudent AS id, u.name, u.lastName, s.curp, s.registration,
         s.timeModality, s.semester, s.programId, p.name AS programName,
         s.enrollmentCycleId, sc.cycle AS cycleName,
         s.statusId, st.type AS statusType,
         dir_u.name AS directorName, dir_u.lastName AS directorLastName,
         coord_u.name AS coordinadorName, coord_u.lastName AS coordinadorLastName
       FROM students s
       JOIN users u ON s.userId = u.idUser
       JOIN programs p ON s.programId = p.idProgram
       JOIN schoolCycles sc ON s.enrollmentCycleId = sc.idCycle
       JOIN statusCatalog st ON s.statusId = st.idStatus
       LEFT JOIN professors dir_prof ON s.academicDirectorId = dir_prof.idProfessor
       LEFT JOIN users dir_u ON dir_prof.userId = dir_u.idUser
       LEFT JOIN professors coord_prof ON s.localTutorId = coord_prof.idProfessor
       LEFT JOIN users coord_u ON coord_prof.userId = coord_u.idUser
       WHERE s.idStudent = ?`,
      [studentId]
    );

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Compute promedio (average grade)
    const promedioResult = await queryOne<{ promedio: number | null }>(
      `SELECT CAST(AVG(CAST(sig.grade AS DECIMAL(5,2))) AS DECIMAL(5,2)) AS promedio
       FROM studentsInGroups sig
       WHERE sig.studentId = ? AND sig.grade IS NOT NULL`,
      [studentId]
    );

    // Compute creditos (credits from passed courses)
    const creditosResult = await queryOne<{ creditos: number }>(
      `SELECT COALESCE(SUM(sub.credits), 0) AS creditos
       FROM studentsInGroups sig
       JOIN studyGroups sg ON sig.groupId = sg.idGroup
       JOIN subjects sub ON sg.subjectId = sub.idSubject
       WHERE sig.studentId = ? AND sig.grade IS NOT NULL`,
      [studentId]
    );

    const directorName =
      student.directorName && student.directorLastName
        ? `${student.directorName} ${student.directorLastName}`
        : null;
    const coordinadorName =
      student.coordinadorName && student.coordinadorLastName
        ? `${student.coordinadorName} ${student.coordinadorLastName}`
        : null;

    Logger.debug("Students", `GET student ${studentId}`);

    return NextResponse.json({
      success: true,
      data: {
        id: student.id,
        name: student.name,
        lastName: student.lastName,
        curp: student.curp,
        registration: student.registration,
        timeModality: student.timeModality,
        semester: student.semester,
        programId: student.programId,
        programName: student.programName,
        enrollmentCycleId: student.enrollmentCycleId,
        cycleName: student.cycleName,
        statusId: student.statusId,
        statusType: student.statusType,
        directorName,
        coordinadorName,
        promedio: promedioResult?.promedio ?? null,
        creditos: creditosResult?.creditos ?? 0,
      },
    });
  } catch (err) {
    Logger.error("Students", "GET by ID error", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── PUT /api/students/[id] ────────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const studentId = parseInt(id, 10);
    if (isNaN(studentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid student ID" },
        { status: 400 }
      );
    }

    // Check student exists and get userId
    const existing = await queryOne<{ idStudent: number; userId: number }>(
      "SELECT idStudent, userId FROM students WHERE idStudent = ?",
      [studentId]
    );
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, lastName, curp, registration, programId, academicDirectorId, localTutorId, enrollmentCycleId, semester } = body;

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

    // Update student fields
    const studentFields: string[] = [];
    const studentValues: (string | number)[] = [];
    if (curp !== undefined) { studentFields.push("curp = ?"); studentValues.push(curp); }
    if (registration !== undefined) { studentFields.push("registration = ?"); studentValues.push(registration); }
    if (programId !== undefined) { studentFields.push("programId = ?"); studentValues.push(programId); }
    if (academicDirectorId !== undefined) { studentFields.push("academicDirectorId = ?"); studentValues.push(academicDirectorId); }
    if (localTutorId !== undefined) { studentFields.push("localTutorId = ?"); studentValues.push(localTutorId); }
    if (enrollmentCycleId !== undefined) { studentFields.push("enrollmentCycleId = ?"); studentValues.push(enrollmentCycleId); }
    if (semester !== undefined) { studentFields.push("semester = ?"); studentValues.push(semester); }

    if (studentFields.length > 0) {
      studentValues.push(studentId);
      await execute(
        `UPDATE students SET ${studentFields.join(", ")} WHERE idStudent = ?`,
        studentValues
      );
    }

    Logger.debug("Students", `PUT student ${studentId}`);

    // Return updated profile by calling the same logic as GET
    const updated = await queryOne<{
      id: number;
      name: string;
      lastName: string;
      curp: string;
      registration: string;
      timeModality: string;
      semester: number;
      programId: number;
      programName: string;
      enrollmentCycleId: number;
      cycleName: string;
      statusId: number;
      statusType: string;
      directorName: string | null;
      directorLastName: string | null;
      coordinadorName: string | null;
      coordinadorLastName: string | null;
    }>(
      `SELECT
         s.idStudent AS id, u.name, u.lastName, s.curp, s.registration,
         s.timeModality, s.semester, s.programId, p.name AS programName,
         s.enrollmentCycleId, sc.cycle AS cycleName,
         s.statusId, st.type AS statusType,
         dir_u.name AS directorName, dir_u.lastName AS directorLastName,
         coord_u.name AS coordinadorName, coord_u.lastName AS coordinadorLastName
       FROM students s
       JOIN users u ON s.userId = u.idUser
       JOIN programs p ON s.programId = p.idProgram
       JOIN schoolCycles sc ON s.enrollmentCycleId = sc.idCycle
       JOIN statusCatalog st ON s.statusId = st.idStatus
       LEFT JOIN professors dir_prof ON s.academicDirectorId = dir_prof.idProfessor
       LEFT JOIN users dir_u ON dir_prof.userId = dir_u.idUser
       LEFT JOIN professors coord_prof ON s.localTutorId = coord_prof.idProfessor
       LEFT JOIN users coord_u ON coord_prof.userId = coord_u.idUser
       WHERE s.idStudent = ?`,
      [studentId]
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Student not found after update" },
        { status: 500 }
      );
    }

    const promedioResult = await queryOne<{ promedio: number | null }>(
      `SELECT CAST(AVG(CAST(sig.grade AS DECIMAL(5,2))) AS DECIMAL(5,2)) AS promedio
       FROM studentsInGroups sig
       WHERE sig.studentId = ? AND sig.grade IS NOT NULL`,
      [studentId]
    );

    const creditosResult = await queryOne<{ creditos: number }>(
      `SELECT COALESCE(SUM(sub.credits), 0) AS creditos
       FROM studentsInGroups sig
       JOIN studyGroups sg ON sig.groupId = sg.idGroup
       JOIN subjects sub ON sg.subjectId = sub.idSubject
       WHERE sig.studentId = ? AND sig.grade IS NOT NULL`,
      [studentId]
    );

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        lastName: updated.lastName,
        curp: updated.curp,
        registration: updated.registration,
        timeModality: updated.timeModality,
        semester: updated.semester,
        programId: updated.programId,
        programName: updated.programName,
        enrollmentCycleId: updated.enrollmentCycleId,
        cycleName: updated.cycleName,
        statusId: updated.statusId,
        statusType: updated.statusType,
        directorName:
          updated.directorName && updated.directorLastName
            ? `${updated.directorName} ${updated.directorLastName}`
            : null,
        coordinadorName:
          updated.coordinadorName && updated.coordinadorLastName
            ? `${updated.coordinadorName} ${updated.coordinadorLastName}`
            : null,
        promedio: promedioResult?.promedio ?? null,
        creditos: creditosResult?.creditos ?? 0,
      },
    });
  } catch (err) {
    Logger.error("Students", "PUT error", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── DELETE /api/students/[id] ─────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const studentId = parseInt(id, 10);
    if (isNaN(studentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid student ID" },
        { status: 400 }
      );
    }

    const existing = await queryOne<{ idStudent: number }>(
      "SELECT idStudent FROM students WHERE idStudent = ?",
      [studentId]
    );
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Find DESHABILITADO status, fallback to BAJA DEFINITIVA
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
        { success: false, error: "No deactivation status found in catalog" },
        { status: 500 }
      );
    }

    await execute(
      "UPDATE students SET statusId = ? WHERE idStudent = ?",
      [status.idStatus, studentId]
    );

    Logger.debug("Students", `DELETE (soft) student ${studentId}`);

    return NextResponse.json({
      success: true,
      message: "Estudiante dado de baja",
    });
  } catch (err) {
    Logger.error("Students", "DELETE error", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
