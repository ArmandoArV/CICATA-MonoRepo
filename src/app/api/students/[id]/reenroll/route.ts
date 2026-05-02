import { NextRequest, NextResponse } from "next/server";
import { ensureInitialized } from "@/backend/database/init";
import { queryOne, execute } from "@/backend/database/pool";
import { verifyToken, Logger } from "@/backend/utils";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(
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

    // Verify student exists
    const student = await queryOne<{ idStudent: number }>(
      "SELECT idStudent FROM students WHERE idStudent = ?",
      [studentId]
    );
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { registration, advisorId, directorId } = body;

    if (!advisorId || !directorId) {
      return NextResponse.json(
        { success: false, error: "advisorId and directorId are required" },
        { status: 400 }
      );
    }

    // Get the latest cycle
    const latestCycle = await queryOne<{ idCycle: number }>(
      "SELECT idCycle FROM schoolCycles ORDER BY startDate DESC LIMIT 1",
      []
    );
    if (!latestCycle) {
      return NextResponse.json(
        { success: false, error: "No school cycle found" },
        { status: 500 }
      );
    }

    // Create reenrollment record
    const result = await execute(
      "INSERT INTO reenrollments (studentId, cycleId, advisorId, academicDirectorId) VALUES (?, ?, ?, ?)",
      [studentId, latestCycle.idCycle, advisorId, directorId]
    );

    // Update student fields
    const updateFields: string[] = ["academicDirectorId = ?"];
    const updateValues: (string | number)[] = [directorId];

    if (registration) {
      updateFields.push("registration = ?");
      updateValues.push(registration);
    }

    updateValues.push(studentId);
    await execute(
      `UPDATE students SET ${updateFields.join(", ")} WHERE idStudent = ?`,
      updateValues
    );

    Logger.debug("Students", `Reenrolled student ${studentId} in cycle ${latestCycle.idCycle}`);

    return NextResponse.json({
      success: true,
      data: {
        idReenrollment: result.insertId,
        studentId,
        cycleId: latestCycle.idCycle,
        advisorId,
        academicDirectorId: directorId,
      },
    });
  } catch (err) {
    Logger.error("Students", "Reenroll error", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
