import { DocumentController } from "@/backend/controllers";
import { ensureInitialized } from "@/backend/database/init";

export async function GET() {
  await ensureInitialized();
  return DocumentController.listAvailableTemplates();
}
