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
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = cookieToken || bearerToken;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInitialized();
    const payload = await authenticate(req);
    if (!payload) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const group = await queryOne<{
      id: number;
      groupKey: string;
      subjectId: number;
      subjectName: string;
      subjectKey: string;
      campus: string;
      place: string;
      schedule: string | null;
      professorId: number;
      professorName: string;
      cycleId: number;
      cycleName: string;
      observations: string | null;
    }>(
      `SELECT
         g.idGroup AS id, g.groupKey,
         g.subjectId, s.name AS subjectName, s.subjectKey,
         g.campus, g.place, g.schedule,
         g.professorId, CONCAT(u.name, ' ', u.lastName) AS professorName,
         g.cycleId, sc.cycle AS cycleName,
         g.observations
       FROM studyGroups g
       JOIN subjects s      ON g.subjectId = s.idSubject
       JOIN professors pr   ON g.professorId = pr.idProfessor
       JOIN users u         ON pr.userId = u.idUser
       JOIN schoolCycles sc ON g.cycleId = sc.idCycle
       WHERE g.idGroup = ?`,
      [id]
    );

    if (!group) return NextResponse.json({ success: false, error: "Group not found" }, { status: 404 });

    const students = await query<{
      id: number;
      enrollmentId: number;
      name: string;
      lastName: string;
      registration: string;
      programName: string;
      cycleName: string;
      statusType: string;
    }>(
      `SELECT
         st.idStudent AS id, sig.idEnrollment AS enrollmentId,
         u.name, u.lastName,
         st.registration,
         p.name AS programName,
         sc.cycle AS cycleName,
         COALESCE(stat.type, 'ACTIVO') AS statusType
       FROM studentsInGroups sig
       JOIN students st     ON sig.studentId = st.idStudent
       JOIN users u         ON st.userId = u.idUser
       JOIN programs p      ON st.programId = p.idProgram
       JOIN schoolCycles sc ON st.enrollmentCycleId = sc.idCycle
       LEFT JOIN statusCatalog stat ON st.statusId = stat.idStatus
       WHERE sig.groupId = ?`,
      [id]
    );

    const professors = await query<{
      id: number;
      visitorId: number;
      name: string;
      lastName: string;
      registration: string;
      programName: string;
      academicLoad: number;
      statusType: string;
      assignedHours: number;
    }>(
      `SELECT
         pr.idProfessor AS id, gvp.idGroupVisitor AS visitorId,
         u.name, u.lastName,
         COALESCE(pr.ipnRegistration, pr.employeeNumber) AS registration,
         p.name AS programName,
         pr.academicLoad,
         COALESCE(stat.type, 'ACTIVO') AS statusType,
         gvp.assignedHours
       FROM groupVisitingProfessors gvp
       JOIN professors pr   ON gvp.professorId = pr.idProfessor
       JOIN users u         ON pr.userId = u.idUser
       JOIN programs p      ON pr.programId = p.idProgram
       LEFT JOIN statusCatalog stat ON pr.statusId = stat.idStatus
       WHERE gvp.groupId = ?`,
      [id]
    );

    return NextResponse.json({
      success: true,
      data: { ...group, students, professors },
    });
  } catch (err) {
    Logger.error("Groups", "Get error", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInitialized();
    const payload = await authenticate(req);
    if (!payload) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { groupKey, subjectId, campus, place, schedule, professorId, cycleId, observations } = body;

    const sets: string[] = [];
    const vals: (string | number | null)[] = [];

    if (groupKey != null) { sets.push("groupKey = ?"); vals.push(groupKey); }
    if (subjectId != null) { sets.push("subjectId = ?"); vals.push(subjectId); }
    if (campus != null) { sets.push("campus = ?"); vals.push(campus); }
    if (place != null) { sets.push("place = ?"); vals.push(place); }
    if (schedule !== undefined) { sets.push("schedule = ?"); vals.push(schedule); }
    if (professorId != null) { sets.push("professorId = ?"); vals.push(professorId); }
    if (cycleId != null) { sets.push("cycleId = ?"); vals.push(cycleId); }
    if (observations !== undefined) { sets.push("observations = ?"); vals.push(observations); }

    if (sets.length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

    vals.push(Number(id));
    await execute(`UPDATE studyGroups SET ${sets.join(", ")} WHERE idGroup = ?`, vals);

    Logger.debug("Groups", `Updated group ${id}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    Logger.error("Groups", "Update error", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInitialized();
    const payload = await authenticate(req);
    if (!payload) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    await execute("DELETE FROM studentsInGroups WHERE groupId = ?", [id]);
    await execute("DELETE FROM groupVisitingProfessors WHERE groupId = ?", [id]);
    const result = await execute("DELETE FROM studyGroups WHERE idGroup = ?", [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: "Group not found" }, { status: 404 });
    }

    Logger.debug("Groups", `Deleted group ${id}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    Logger.error("Groups", "Delete error", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
