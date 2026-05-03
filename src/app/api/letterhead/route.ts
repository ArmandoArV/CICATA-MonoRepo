import { NextRequest } from "next/server";
import { LetterheadController } from "@/backend/controllers";

export async function GET(request: NextRequest) {
  return LetterheadController.get(request);
}

export async function PUT(request: NextRequest) {
  return LetterheadController.update(request);
}

export async function DELETE(request: NextRequest) {
  return LetterheadController.deleteSlot(request);
}
