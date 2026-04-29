import { DocumentController } from "@/backend/controllers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { NextRequest } = await import("next/server");
  return DocumentController.generate(new NextRequest(request.url, request));
}
