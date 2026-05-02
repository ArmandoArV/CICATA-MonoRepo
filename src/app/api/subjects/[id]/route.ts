import { NextRequest, NextResponse } from "next/server";
import { ensureInitialized } from "@/backend/database/init";
import { queryOne, execute } from "@/backend/database/pool";
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
    const row = await queryOne<{
      idSubject: number;
      name: string;
      subjectKey: string;
      credits: number;
      semester: number;
      topics: string;
    }>("SELECT idSubject, name, subjectKey, credits, semester, topics FROM subjects WHERE idSubject = ? AND isDeleted = 0", [id]);

    if (!row) return NextResponse.json({ success: false, error: "Subject not found" }, { status: 404 });

    let parsedTopics: string[] = [];
    try { parsedTopics = JSON.parse(row.topics); } catch { parsedTopics = []; }

    return NextResponse.json({
      success: true,
      data: {
        id: row.idSubject,
        name: row.name,
        subjectKey: row.subjectKey,
        credits: row.credits,
        semester: row.semester,
        topics: parsedTopics,
      },
    });
  } catch (err) {
    Logger.error("Subjects", "Get error", err);
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
    const { name, subjectKey, credits, semester, topics } = body;

    const sets: string[] = [];
    const vals: (string | number)[] = [];

    if (name != null) { sets.push("name = ?"); vals.push(name); }
    if (subjectKey != null) { sets.push("subjectKey = ?"); vals.push(subjectKey); }
    if (credits != null) { sets.push("credits = ?"); vals.push(credits); }
    if (semester != null) { sets.push("semester = ?"); vals.push(semester); }
    if (topics != null) { sets.push("topics = ?"); vals.push(JSON.stringify(Array.isArray(topics) ? topics : [])); }

    if (sets.length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

    vals.push(Number(id));
    await execute(`UPDATE subjects SET ${sets.join(", ")} WHERE idSubject = ?`, vals);

    Logger.debug("Subjects", `Updated subject ${id}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    Logger.error("Subjects", "Update error", err);
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
    const result = await execute("UPDATE subjects SET isDeleted = 1 WHERE idSubject = ?", [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: "Subject not found" }, { status: 404 });
    }

    Logger.debug("Subjects", `Soft-deleted subject ${id}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    Logger.error("Subjects", "Delete error", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
