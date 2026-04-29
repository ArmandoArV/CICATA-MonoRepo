import { DocumentController } from "@/backend/controllers";
import { ensureInitialized } from "@/backend/database/init";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await ensureInitialized();
  const { NextRequest } = await import("next/server");
  return DocumentController.generate(new NextRequest(request.url, request));
}
