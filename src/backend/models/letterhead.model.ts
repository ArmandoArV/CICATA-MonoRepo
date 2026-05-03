import "server-only";

import type { LetterheadConfigRow } from "@/backend/types";
import type { LetterheadConfigDTO } from "@/shared/types";

function bufferToBase64(buf: Buffer | null): string | null {
  if (!buf || buf.length === 0) return null;
  return buf.toString("base64");
}

export function toLetterheadConfigDTO(row: LetterheadConfigRow): LetterheadConfigDTO {
  return {
    logoHeader: bufferToBase64(row.logoHeader),
    topRight: bufferToBase64(row.topRight),
    footerBottom: bufferToBase64(row.footerBottom),
    headerBarColor: row.headerBarColor,
    accentColor: row.accentColor,
    updatedAt: row.updatedAt.toISOString(),
  };
}
