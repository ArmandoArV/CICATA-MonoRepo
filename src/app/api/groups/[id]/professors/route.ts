import { NextRequest, NextResponse } from "next/server";
import { ensureInitialized } from "@/backend/database/init";
import { execute } from "@/backend/database/pool";
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInitialized();
    const payload = await authenticate(req);
    if (!payload) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { professors } = body;

    if (!Array.isArray(professors) || professors.length === 0) {
      return NextResponse.json({ success: false, error: "professors array required" }, { status: 400 });
    }

    for (const p of professors) {
      await execute(
        "INSERT IGNORE INTO groupVisitingProfessors (groupId, professorId, assignedHours) VALUES (?, ?, ?)",
        [id, p.professorId, p.assignedHours || 0]
      );
    }

    Logger.debug("Groups", `Added ${professors.length} professors to group ${id}`);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    Logger.error("Groups", "Add professors error", err);
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
    const body = await req.json();
    const { professorIds } = body;

    if (!Array.isArray(professorIds) || professorIds.length === 0) {
      return NextResponse.json({ success: false, error: "professorIds array required" }, { status: 400 });
    }

    for (const profId of professorIds) {
      await execute(
        "DELETE FROM groupVisitingProfessors WHERE groupId = ? AND professorId = ?",
        [id, profId]
      );
    }

    Logger.debug("Groups", `Removed ${professorIds.length} professors from group ${id}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    Logger.error("Groups", "Remove professors error", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
