import { NextRequest } from "next/server";
import { LetterheadController } from "@/backend/controllers";

export async function PUT(request: NextRequest) {
  return LetterheadController.updateWatermark(request);
}
