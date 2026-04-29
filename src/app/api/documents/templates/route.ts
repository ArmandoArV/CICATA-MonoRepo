import { DocumentController } from "@/backend/controllers";

export async function GET() {
  return DocumentController.listAvailableTemplates();
}
