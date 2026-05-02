import { NextRequest } from "next/server";
import { DocumentController } from "@/backend/controllers";
import { ensureInitialized } from "@/backend/database/init";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  await ensureInitialized();
  return DocumentController.download(request);
}
