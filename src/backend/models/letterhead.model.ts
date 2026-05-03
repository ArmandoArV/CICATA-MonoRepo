import "server-only";

import fs from "fs";
import type { LetterheadConfigRow } from "@/backend/types";
import type { LetterheadConfigDTO } from "@/shared/types";
import { ASSETS } from "@/backend/templates/document-layout";

function bufferToBase64(buf: Buffer | null): string | null {
  if (!buf || buf.length === 0) return null;
  return buf.toString("base64");
}

function fileToBase64(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath).toString("base64");
  } catch {
    return null;
  }
}

export function toLetterheadConfigDTO(row: LetterheadConfigRow): LetterheadConfigDTO {
  return {
    logoHeader: bufferToBase64(row.logoHeader) ?? fileToBase64(ASSETS.header),
    topRight: bufferToBase64(row.topRight) ?? fileToBase64(ASSETS.topRight),
    footerBottom: bufferToBase64(row.footerBottom) ?? fileToBase64(ASSETS.footer),
    headerBarColor: row.headerBarColor,
    accentColor: row.accentColor,
    updatedAt: row.updatedAt.toISOString(),
  };
}
