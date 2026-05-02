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
    const { studentIds } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ success: false, error: "studentIds array required" }, { status: 400 });
    }

    for (const studentId of studentIds) {
      await execute(
        "INSERT IGNORE INTO studentsInGroups (studentId, groupId) VALUES (?, ?)",
        [studentId, id]
      );
    }

    Logger.debug("Groups", `Added ${studentIds.length} students to group ${id}`);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    Logger.error("Groups", "Add students error", err);
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
    const { studentIds } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ success: false, error: "studentIds array required" }, { status: 400 });
    }

    for (const studentId of studentIds) {
      await execute(
        "DELETE FROM studentsInGroups WHERE studentId = ? AND groupId = ?",
        [studentId, id]
      );
    }

    Logger.debug("Groups", `Removed ${studentIds.length} students from group ${id}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    Logger.error("Groups", "Remove students error", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
